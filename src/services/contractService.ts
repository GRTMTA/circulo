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

const rpcServer = new rpc.Server(env.sorobanRpcUrl);

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

function assertPositiveAmount(amount: number | string) {
  const value = BigInt(amount);
  if (value <= 0n) throw new Error("Transaction amount must be greater than zero.");
  return value;
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

export async function triggerContributeOnChain(
  userAddress: string,
  contractAddress: string,
  tokenContractId: string,
  amount: number | string
): Promise<{ txXdr: string }> {
  assertAccountId(userAddress, "Member address");
  assertContractId(tokenContractId, "Token contract ID");

  const contract = new Contract(contractAddress);
  const operation = contract.call(
    "contribute",
    nativeToScVal(userAddress, { type: "address" }),
    nativeToScVal(tokenContractId, { type: "address" }),
    nativeToScVal(assertPositiveAmount(amount), { type: "i128" })
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
  tokenContractId: string,
  recipientAddress: string,
  totalPool: number | string
): Promise<{ txXdr: string }> {
  assertAccountId(adminAddress, "Administrator address");
  assertAccountId(recipientAddress, "Recipient address");
  assertContractId(tokenContractId, "Token contract ID");

  const contract = new Contract(contractAddress);
  const operation = contract.call(
    "execute_payout",
    nativeToScVal(adminAddress, { type: "address" }),
    nativeToScVal(tokenContractId, { type: "address" }),
    nativeToScVal(recipientAddress, { type: "address" }),
    nativeToScVal(assertPositiveAmount(totalPool), { type: "i128" })
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
  tokenContractId: string,
  amount: number | string
) {
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
  const expectedAmount = assertPositiveAmount(amount);
  const invokedContract = Address.fromScAddress(invocation.contractAddress()).toString();
  const invokedFunction = invocation.functionName().toString();
  const invokedMember = Address.fromScVal(args[0]).toString();
  const invokedToken = Address.fromScVal(args[1]).toString();
  const invokedAmount = BigInt(scValToNative(args[2]));

  if (
    invokedContract !== contractAddress ||
    invokedFunction !== "contribute" ||
    invokedMember !== memberAddress ||
    invokedToken !== tokenContractId ||
    invokedAmount !== expectedAmount
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