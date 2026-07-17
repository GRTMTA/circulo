import {
  Address,
  BASE_FEE,
  Contract,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  StrKey,
} from "@stellar/stellar-sdk";

import { env, assertTestnetConfig } from "@/lib/env";
import { circleIdToScVal } from "@/services/contractService";

const rpcServer = new rpc.Server(env.sorobanRpcUrl);
const DISSOLUTION_PROGRESS_EVENT = nativeToScVal("dissolution_progress", {
  type: "symbol",
}).toXDR("base64");

export interface DissolutionProgress {
  yesVotes: number;
  requiredVotes: number;
  status: string;
  lastVoteMember: string;
  lastVoteApproved: boolean;
  ledger: number;
  transactionHash: string;
}

function assertAccountId(address: string, label: string) {
  if (!StrKey.isValidEd25519PublicKey(address)) {
    throw new Error(`${label} is not a valid Stellar account.`);
  }
}

function assertContractId(address: string, label: string) {
  if (!StrKey.isValidContract(address)) {
    throw new Error(`${label} is not a valid Stellar contract ID.`);
  }
}

function assertPoolId(poolId: string) {
  if (!/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(poolId)) {
    throw new Error("Pool ID must be a UUID.");
  }
}

async function buildPreparedTransaction(
  sourceAddress: string,
  contractAddress: string,
  operation: ReturnType<Contract["call"]>
) {
  assertTestnetConfig();
  assertAccountId(sourceAddress, "Source address");
  assertContractId(contractAddress, "Circulo contract ID");

  const sourceAccount = await rpcServer.getAccount(sourceAddress);
  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: env.sorobanNetworkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(60)
    .build();

  return rpcServer.prepareTransaction(transaction);
}

/** Builds (but does not sign or submit) the creator's dissolution proposal. */
export async function triggerProposeDissolution(
  creatorAddress: string,
  contractAddress: string,
  poolId: string
): Promise<{ txXdr: string }> {
  assertAccountId(creatorAddress, "Creator address");
  assertContractId(contractAddress, "Circulo contract ID");
  assertPoolId(poolId);

  const operation = new Contract(contractAddress).call(
    "propose_dissolution",
    circleIdToScVal(poolId),
    Address.fromString(creatorAddress).toScVal()
  );
  const transaction = await buildPreparedTransaction(
    creatorAddress,
    contractAddress,
    operation
  );

  return { txXdr: transaction.toXDR() };
}

/**
 * Builds a member's authenticated vote. The token contract is intentionally
 * absent: the Soroban contract binds the circle asset when collateral or the
 * first contribution is posted, so a voter cannot redirect dissolution funds.
 */
export async function triggerCastDissolutionVote(
  memberAddress: string,
  contractAddress: string,
  poolId: string,
  approve: boolean
): Promise<{ txXdr: string }> {
  assertAccountId(memberAddress, "Member address");
  assertContractId(contractAddress, "Circulo contract ID");
  assertPoolId(poolId);

  const operation = new Contract(contractAddress).call(
    "cast_dissolution_vote",
    circleIdToScVal(poolId),
    Address.fromString(memberAddress).toScVal(),
    nativeToScVal(approve)
  );
  const transaction = await buildPreparedTransaction(
    memberAddress,
    contractAddress,
    operation
  );

  return { txXdr: transaction.toXDR() };
}

function safeInteger(value: unknown, label: string): number {
  const numberValue = typeof value === "bigint" ? Number(value) : value;
  if (
    typeof numberValue !== "number" ||
    !Number.isSafeInteger(numberValue) ||
    numberValue < 0
  ) {
    throw new Error(`Invalid ${label} in dissolution event.`);
  }
  return numberValue;
}

function parseProgressEvent(
  event: rpc.Api.EventResponse
): DissolutionProgress | null {
  const data = scValToNative(event.value);
  if (!Array.isArray(data) || data.length !== 5) return null;

  const [member, approved, yesVotes, requiredVotes, status] = data;
  if (
    typeof member !== "string" ||
    typeof approved !== "boolean" ||
    typeof status !== "string"
  ) {
    return null;
  }

  return {
    yesVotes: safeInteger(yesVotes, "YES vote count"),
    requiredVotes: safeInteger(requiredVotes, "required vote count"),
    status,
    lastVoteMember: member,
    lastVoteApproved: approved,
    ledger: event.ledger,
    transactionHash: event.txHash,
  };
}

function isLaterEvent(
  current: rpc.Api.EventResponse,
  candidate: rpc.Api.EventResponse
) {
  return (
    candidate.ledger > current.ledger ||
    (candidate.ledger === current.ledger &&
      candidate.transactionIndex > current.transactionIndex) ||
    (candidate.ledger === current.ledger &&
      candidate.transactionIndex === current.transactionIndex &&
      candidate.operationIndex >= current.operationIndex)
  );
}

/**
 * Reads the latest dissolution progress event for a pool. The event stream is
 * paged using the Soroban RPC cursor, so the UI is not dependent on a cached
 * Supabase row and survives a NO-vote reset (which emits 0/required, active).
 */
export async function getDissolutionProgress(
  poolId: string
): Promise<DissolutionProgress> {
  assertTestnetConfig();
  assertPoolId(poolId);
  assertContractId(env.contractId, "Circulo contract ID");

  const latestLedger = await rpcServer.getLatestLedger();
  const circleTopic = circleIdToScVal(poolId).toXDR("base64");
  const filters = [
    {
      type: "contract" as const,
      contractIds: [env.contractId],
      topics: [[DISSOLUTION_PROGRESS_EVENT, circleTopic]],
    },
  ];

  const matchingEvents: rpc.Api.EventResponse[] = [];
  let previousCursor: string | undefined;
  let response = await rpcServer.getEvents({
    startLedger: 1,
    endLedger: latestLedger.sequence,
    filters,
    limit: 1000,
  });

  while (true) {
    matchingEvents.push(...response.events);
    if (
      !response.cursor ||
      response.events.length === 0 ||
      response.cursor === previousCursor
    ) {
      break;
    }

    const cursor = response.cursor;
    previousCursor = cursor;
    response = await rpcServer.getEvents({
      cursor,
      filters,
      limit: 1000,
    });
  }

  let latestEvent: rpc.Api.EventResponse | undefined;
  for (const event of matchingEvents) {
    if (!latestEvent || isLaterEvent(latestEvent, event)) {
      latestEvent = event;
    }
  }

  if (!latestEvent) {
    throw new Error("No dissolution progress event exists for this pool.");
  }
  const progress = parseProgressEvent(latestEvent);
  if (!progress) {
    throw new Error("The latest dissolution event has an invalid payload.");
  }
  return progress;
}

// Explicit aliases make the intended use in dashboard code self-documenting
// while retaining the trigger names already used by this repository.
export const prepareProposeDissolution = triggerProposeDissolution;
export const prepareCastDissolutionVote = triggerCastDissolutionVote;
