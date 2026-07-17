import {
  Address,
  BASE_FEE,
  Contract,
  FeeBumpTransaction,
  StrKey,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";

import { assertTestnetConfig, env } from "@/lib/env";
import { stellarAmountToBaseUnits } from "@/lib/stellar-amount";

const rpcServer = new rpc.Server(env.sorobanRpcUrl);

export class ContributionAlreadyPaidError extends Error {
  readonly round: number;
  readonly txHash: string | null;

  constructor(round: number, txHash: string | null) {
    super(`This contribution is already paid on-chain for round ${round}.`);
    this.name = "ContributionAlreadyPaidError";
    this.round = round;
    this.txHash = txHash;
  }
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

export function uuidToU128(uuid: string): bigint {
  const hex = uuid.replace(/-/g, "");
  return BigInt("0x" + hex);
}

export function circleIdToScVal(circleId: string): xdr.ScVal {
  return nativeToScVal(uuidToU128(circleId), { type: "u128" });
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

async function readContractValue(
  sourceAddress: string,
  contractAddress: string,
  functionName: string,
  ...args: xdr.ScVal[]
) {
  const sourceAccount = await rpcServer.getAccount(sourceAddress);
  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: env.sorobanNetworkPassphrase,
  })
    .addOperation(new Contract(contractAddress).call(functionName, ...args))
    .setTimeout(30)
    .build();
  const simulation = await rpcServer.simulateTransaction(transaction);
  if (!rpc.Api.isSimulationSuccess(simulation) || !simulation.result) {
    throw new Error(`Could not read ${functionName} from the Circulo contract.`);
  }
  return scValToNative(simulation.result.retval);
}

async function findRecentContributionTransaction(
  memberAddress: string,
  contractAddress: string,
  circleId: string,
  tokenContractId: string,
) {
  const response = await fetch(
    `${env.horizonUrl}/accounts/${memberAddress}/transactions?limit=100&order=desc`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    _embedded?: { records?: Array<{ hash: string; successful?: boolean; envelope_xdr: string }> };
  };
  const expectedCircle = uuidToU128(circleId);

  for (const record of payload._embedded?.records ?? []) {
    if (record.successful !== true) continue;
    try {
      const parsed = TransactionBuilder.fromXDR(
        record.envelope_xdr,
        env.sorobanNetworkPassphrase,
      );
      const transaction =
        parsed instanceof FeeBumpTransaction ? parsed.innerTransaction : parsed;
      for (const operation of transaction.operations) {
        if (operation.type !== "invokeHostFunction") continue;
        const invocation = operation.func.invokeContract();
        if (
          Address.fromScAddress(invocation.contractAddress()).toString() !== contractAddress ||
          invocation.functionName().toString() !== "contribute"
        ) {
          continue;
        }
        const args = invocation.args();
        if (
          BigInt(scValToNative(args[0])) === expectedCircle &&
          Address.fromScVal(args[1]).toString() === memberAddress &&
          Address.fromScVal(args[2]).toString() === tokenContractId
        ) {
          return record.hash;
        }
      }
    } catch {
      // Ignore Horizon records that are not parseable Soroban transactions.
    }
  }
  return null;
}

async function assertContributionIsAvailable(
  userAddress: string,
  contractAddress: string,
  circleId: string,
  tokenContractId: string,
) {
  const round = Number(
    await readContractValue(
      userAddress,
      contractAddress,
      "current_round",
      circleIdToScVal(circleId),
    ),
  );
  const alreadyPaid = Boolean(
    await readContractValue(
      userAddress,
      contractAddress,
      "is_paid",
      circleIdToScVal(circleId),
      nativeToScVal(round, { type: "u32" }),
      Address.fromString(userAddress).toScVal(),
    ),
  );
  if (alreadyPaid) {
    const txHash = await findRecentContributionTransaction(
      userAddress,
      contractAddress,
      circleId,
      tokenContractId,
    );
    throw new ContributionAlreadyPaidError(round, txHash);
  }
}

/**
 * Calling a different deployment from the one that initialized a circle
 * otherwise surfaces as Soroban's opaque `WasmVm/InvalidAction` trap.
 */
async function assertCircleInitializedOnContract(
  sourceAddress: string,
  contractAddress: string,
  circleId: string
) {
  const sourceAccount = await rpcServer.getAccount(sourceAddress);
  const operation = new Contract(contractAddress).call(
    "is_initialized",
    circleIdToScVal(circleId)
  );
  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: env.sorobanNetworkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();
  const simulation = await rpcServer.simulateTransaction(transaction);

  if (!rpc.Api.isSimulationSuccess(simulation) || !simulation.result) {
    throw new Error("Could not verify whether this circle exists on the configured contract.");
  }
  if (scValToNative(simulation.result.retval) !== true) {
    throw new Error(
      `This circle is not initialized on contract ${contractAddress}. ` +
        "It was likely created before the contract was redeployed; switch to its original contract ID or remove only its dashboard record."
    );
  }
}

export async function triggerInitializeOnChain(
  creatorAddress: string,
  contractAddress: string,
  circleId: string,
  contributionAmount: number | string,
  collateralAmount: number | string,
  intervalSeconds: number | string,
  cycleCount: number,
  members: string[]
): Promise<{ txXdr: string }> {
  assertAccountId(creatorAddress, "Creator address");
  assertContractId(contractAddress, "Circulo contract ID");
  members.forEach((m) => assertAccountId(m, "Member address"));
  if (!Number.isInteger(cycleCount) || cycleCount < 1 || cycleCount > 12) {
    throw new Error("Cycle count must be a whole number between 1 and 12.");
  }

  const contract = new Contract(contractAddress);
  const operation = contract.call(
    "initialize",
    circleIdToScVal(circleId),
    Address.fromString(creatorAddress).toScVal(),
    // The UI stores display amounts (for example `10` XLM). Soroban token
    // transfers use integer base units, so send exactly 10_000_000 stroops.
    nativeToScVal(stellarAmountToBaseUnits(contributionAmount), { type: "i128" }),
    nativeToScVal(stellarAmountToBaseUnits(collateralAmount), { type: "i128" }),
    nativeToScVal(BigInt(intervalSeconds), { type: "u64" }),
    nativeToScVal(cycleCount, { type: "u32" }),
    nativeToScVal(
      members.map((m) => Address.fromString(m).toScVal())
    )
  );

  const transaction = await buildPreparedTransaction(
    creatorAddress,
    contractAddress,
    operation
  );

  return { txXdr: transaction.toXDR() };
}

export async function triggerActivateOnChain(
  creatorAddress: string,
  contractAddress: string,
  circleId: string
): Promise<{ txXdr: string }> {
  assertAccountId(creatorAddress, "Creator address");
  assertContractId(contractAddress, "Circulo contract ID");
  await assertCircleInitializedOnContract(
    creatorAddress,
    contractAddress,
    circleId
  );

  const contract = new Contract(contractAddress);
  const operation = contract.call(
    "activate",
    circleIdToScVal(circleId),
    Address.fromString(creatorAddress).toScVal()
  );

  const transaction = await buildPreparedTransaction(
    creatorAddress,
    contractAddress,
    operation
  );

  return { txXdr: transaction.toXDR() };
}

export async function triggerCancelCircleOnChain(
  creatorAddress: string,
  contractAddress: string,
  circleId: string
): Promise<{ txXdr: string }> {
  assertAccountId(creatorAddress, "Creator address");
  assertContractId(contractAddress, "Circulo contract ID");
  await assertCircleInitializedOnContract(
    creatorAddress,
    contractAddress,
    circleId
  );

  const contract = new Contract(contractAddress);
  const operation = contract.call(
    "cancel_pool",
    circleIdToScVal(circleId),
    Address.fromString(creatorAddress).toScVal()
  );

  const transaction = await buildPreparedTransaction(
    creatorAddress,
    contractAddress,
    operation
  );

  return { txXdr: transaction.toXDR() };
}

export async function triggerClaimRefundOnChain(
  userAddress: string,
  contractAddress: string,
  circleId: string,
  tokenContractId: string
): Promise<{ txXdr: string }> {
  assertAccountId(userAddress, "Member address");
  assertContractId(tokenContractId, "Token contract ID");

  const contract = new Contract(contractAddress);
  const operation = contract.call(
    "claim_refund",
    circleIdToScVal(circleId),
    Address.fromString(userAddress).toScVal(),
    Address.fromString(tokenContractId).toScVal()
  );

  const transaction = await buildPreparedTransaction(
    userAddress,
    contractAddress,
    operation
  );

  return { txXdr: transaction.toXDR() };
}

export async function triggerContributeOnChain(
  userAddress: string,
  contractAddress: string,
  circleId: string,
  tokenContractId: string
): Promise<{ txXdr: string }> {
  assertAccountId(userAddress, "Member address");
  assertContractId(contractAddress, "Circulo contract ID");
  assertContractId(tokenContractId, "Token contract ID");
  await assertContributionIsAvailable(userAddress, contractAddress, circleId, tokenContractId);

  const contract = new Contract(contractAddress);
  const operation = contract.call(
    "contribute",
    circleIdToScVal(circleId),
    Address.fromString(userAddress).toScVal(),
    Address.fromString(tokenContractId).toScVal()
  );
  const transaction = await buildPreparedTransaction(
    userAddress,
    contractAddress,
    operation
  );

  return { txXdr: transaction.toXDR() };
}

export async function triggerPostCollateralOnChain(
  userAddress: string,
  contractAddress: string,
  circleId: string,
  tokenContractId: string
): Promise<{ txXdr: string }> {
  assertAccountId(userAddress, "Member address");
  assertContractId(tokenContractId, "Token contract ID");

  const contract = new Contract(contractAddress);
  const operation = contract.call(
    "post_collateral",
    circleIdToScVal(circleId),
    Address.fromString(userAddress).toScVal(),
    Address.fromString(tokenContractId).toScVal()
  );
  const transaction = await buildPreparedTransaction(
    userAddress,
    contractAddress,
    operation
  );

  return { txXdr: transaction.toXDR() };
}

export async function triggerExecutePayoutOnChain(
  adminAddress: string,
  contractAddress: string,
  circleId: string,
  tokenContractId: string
): Promise<{ txXdr: string }> {
  // The recipient is chosen on-chain from the locked payout order for the
  // current round, so it is intentionally not passed by the caller.
  assertAccountId(adminAddress, "Administrator address");
  assertContractId(tokenContractId, "Token contract ID");

  const contract = new Contract(contractAddress);
  const operation = contract.call(
    "execute_payout",
    circleIdToScVal(circleId),
    Address.fromString(adminAddress).toScVal(),
    Address.fromString(tokenContractId).toScVal()
  );
  const transaction = await buildPreparedTransaction(
    adminAddress,
    contractAddress,
    operation
  );

  return { txXdr: transaction.toXDR() };
}

export async function triggerSlashCollateralOnChain(
  adminAddress: string,
  contractAddress: string,
  circleId: string,
  memberAddress: string,
  slashPercentage: number
): Promise<{ txXdr: string }> {
  assertAccountId(adminAddress, "Administrator address");
  assertAccountId(memberAddress, "Member address");
  if (
    !Number.isInteger(slashPercentage) ||
    slashPercentage < 0 ||
    slashPercentage > 100
  ) {
    throw new Error("Slash percentage must be an integer between 0 and 100.");
  }

  const contract = new Contract(contractAddress);
  const operation = contract.call(
    "slash_collateral",
    circleIdToScVal(circleId),
    Address.fromString(adminAddress).toScVal(),
    Address.fromString(memberAddress).toScVal(),
    nativeToScVal(slashPercentage, { type: "u32" })
  );
  const transaction = await buildPreparedTransaction(
    adminAddress,
    contractAddress,
    operation
  );

  return { txXdr: transaction.toXDR() };
}

export async function submitSignedTransaction(txXdr: string) {
  assertTestnetConfig();
  const transaction = TransactionBuilder.fromXDR(
    txXdr,
    env.sorobanNetworkPassphrase
  );
  const submission = await rpcServer.sendTransaction(transaction);

  if (submission.status === "ERROR") {
    throw new Error("Soroban RPC rejected the transaction.");
  }

  const result = await rpcServer.pollTransaction(submission.hash, {
    attempts: 20,
  });
  if (result.status !== "SUCCESS") {
    throw new Error(`Soroban transaction did not succeed (${result.status}).`);
  }

  return { hash: submission.hash };
}

export async function verifyContributeTransaction(
  txHash: string,
  memberAddress: string,
  contractAddress: string,
  circleId: string,
  tokenContractId: string,
  amount?: number | string
) {
  if (amount) {
    console.log("Verifying collateral transaction with expected amount:", amount);
  }
  assertTestnetConfig();
  assertAccountId(memberAddress, "Member address");
  assertContractId(contractAddress, "Circulo contract ID");
  assertContractId(tokenContractId, "Token contract ID");

  if (!/^[0-9a-f]{64}$/i.test(txHash)) {
    throw new Error("Transaction hash is invalid.");
  }

  const result = await rpcServer.getTransaction(txHash);
  if (result.status !== "SUCCESS") {
    throw new Error("The collateral transaction is not confirmed on testnet.");
  }

  const parsed = TransactionBuilder.fromXDR(
    result.envelopeXdr,
    env.sorobanNetworkPassphrase
  );
  const transaction =
    parsed instanceof FeeBumpTransaction ? parsed.innerTransaction : parsed;
  const operation = transaction.operations[0];

  if (transaction.source !== memberAddress || transaction.operations.length !== 1) {
    throw new Error("The collateral transaction source is invalid.");
  }
  if (operation?.type !== "invokeHostFunction") {
    throw new Error("The transaction does not invoke the Circulo contract.");
  }

  const hostFunction = operation.func;
  if (
    hostFunction.switch().value !==
    xdr.HostFunctionType.hostFunctionTypeInvokeContract().value
  ) {
    throw new Error("The transaction does not invoke a contract function.");
  }

  const invocation = hostFunction.invokeContract();
  const args = invocation.args();
  const invokedContract = Address.fromScAddress(invocation.contractAddress()).toString();
  const invokedFunction = invocation.functionName().toString();

  const invokedCircle = BigInt(scValToNative(args[0]));
  const invokedMember = Address.fromScVal(args[1]).toString();
  const invokedToken = Address.fromScVal(args[2]).toString();

  const expectedCircle = uuidToU128(circleId);

  if (
    invokedContract !== contractAddress ||
    (invokedFunction !== "post_collateral" && invokedFunction !== "contribute") ||
    invokedCircle !== expectedCircle ||
    invokedMember !== memberAddress ||
    invokedToken !== tokenContractId
  ) {
    throw new Error("The collateral transaction does not match this agreement.");
  }

  return { hash: result.txHash };
}

export async function simulateTransaction(txXdr: string) {
  assertTestnetConfig();
  const transaction = TransactionBuilder.fromXDR(
    txXdr,
    env.sorobanNetworkPassphrase
  );
  return rpcServer.simulateTransaction(transaction);
}
