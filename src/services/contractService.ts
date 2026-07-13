import {
  Contract,
  TransactionBuilder,
  Account,
  nativeToScVal,
  rpc,
} from "@stellar/stellar-sdk";

// Define network configurations
const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";
const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";

// Create Soroban RPC Server instance
const rpcServer = new rpc.Server(SOROBAN_RPC_URL);

/**
 * Helper function to fetch the current sequence number of an account from Horizon.
 * This is required to initialize the Account object for building the transaction.
 */
async function fetchSourceAccount(address: string): Promise<Account> {
  const url = `${HORIZON_TESTNET_URL}/accounts/${address}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch account sequence for ${address} from Horizon.`);
  }
  const data = await response.json();
  return new Account(address, data.sequence);
}

/**
 * Builds a Soroban transaction to execute a contribution.
 * This wraps the `contribute` function in `circulo.rs`.
 * 
 * Flow:
 * 1. Pulls user's account details from Horizon to get the latest sequence number.
 * 2. Prepares the parameters (`userAddress`, `tokenIdAddress`, `amount`) converted to ScVal.
 * 3. Builds a Transaction with the `invokeContractFunction` operation.
 * 4. Returns the XDR string, which the frontend can hand to Freighter or any other 
 *    Stellar Wallet Kit wallet module for secure signature collection.
 * 
 * Non-Custodial Architecture:
 * - This operation requires the user's signature (`require_auth()` in Soroban).
 * - The contract executes a transfer of tokens directly from the user's wallet into the
 *   contract's own unique address. The app operator never holds these funds.
 */
export async function triggerContributeOnChain(
  userAddress: string,
  contractAddress: string,
  tokenIdAddress: string,
  amount: number | string
): Promise<{ txXdr: string }> {
  // 1. Fetch current sequence number
  const sourceAccount = await fetchSourceAccount(userAddress);

  // 2. Initialize contract client
  const contract = new Contract(contractAddress);

  // 3. Construct the Soroban invocation operation
  const contributeOp = contract.call(
    "contribute",
    nativeToScVal(userAddress, { type: "address" }),
    nativeToScVal(tokenIdAddress, { type: "address" }),
    nativeToScVal(BigInt(amount), { type: "i128" })
  );

  // 4. Build the transaction structure
  const tx = new TransactionBuilder(sourceAccount, {
    fee: "10000", // Standard base fee (simulated on-chain before submission)
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contributeOp)
    .setTimeout(30)
    .build();

  return {
    txXdr: tx.toXDR(),
  };
}

/**
 * Builds a Soroban transaction to execute a savings circle payout round.
 * This wraps the `execute_payout` function in `circulo.rs`.
 * 
 * Flow:
 * 1. Prepares the parameters (`tokenIdAddress`, `recipientAddress`, `totalPool`) converted to ScVal.
 * 2. Builds a transaction invoking the contract's execute_payout function.
 * 
 * Non-Custodial Architecture:
 * - The contract acts as the automated escrow agent.
 * - This function moves the entire accumulated token pool stored in the contract's escrow address
 *   directly to the round's designated recipient address. No intermediary or admin wallet is involved.
 */
export async function triggerExecutePayoutOnChain(
  adminAddress: string,
  contractAddress: string,
  tokenIdAddress: string,
  recipientAddress: string,
  totalPool: number | string
): Promise<{ txXdr: string }> {
  // 1. Fetch current sequence number
  const sourceAccount = await fetchSourceAccount(adminAddress);

  // 2. Initialize contract client
  const contract = new Contract(contractAddress);

  // 3. Construct the Soroban invocation operation
  const executePayoutOp = contract.call(
    "execute_payout",
    nativeToScVal(tokenIdAddress, { type: "address" }),
    nativeToScVal(recipientAddress, { type: "address" }),
    nativeToScVal(BigInt(totalPool), { type: "i128" })
  );

  // 4. Build the transaction structure
  const tx = new TransactionBuilder(sourceAccount, {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(executePayoutOp)
    .setTimeout(30)
    .build();

  return {
    txXdr: tx.toXDR(),
  };
}

/**
 * Simulates a transaction on-chain via Soroban RPC to estimate resource fees.
 * This should be run on the built transaction prior to wallet submission to ensure
 * accurate gas limits and avoid transaction execution failures.
 */
export async function simulateTransaction(txXdr: string): Promise<rpc.Api.SimulateTransactionResponse> {
  const transaction = TransactionBuilder.fromXDR(txXdr, NETWORK_PASSPHRASE);
  const response = await rpcServer.simulateTransaction(transaction);
  return response;
}
