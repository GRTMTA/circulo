export const STELLAR_TESTNET = {
  horizonUrl: "https://horizon-testnet.stellar.org",
  sorobanRpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
  friendbotUrl: "https://friendbot.stellar.org",
} as const;

export function getPublicEnv() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabasePublishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    horizonUrl:
      process.env.NEXT_PUBLIC_HORIZON_URL ?? STELLAR_TESTNET.horizonUrl,
    sorobanRpcUrl:
      process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? STELLAR_TESTNET.sorobanRpcUrl,
    sorobanNetworkPassphrase:
      process.env.NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE ??
      STELLAR_TESTNET.networkPassphrase,
    contractId: process.env.NEXT_PUBLIC_CIRCULO_CONTRACT_ID ?? "",
    tokenContractIds: {
      USDC: process.env.NEXT_PUBLIC_USDC_TOKEN_CONTRACT_ID ?? "",
      USDT: process.env.NEXT_PUBLIC_USDT_TOKEN_CONTRACT_ID ?? "",
      XLM: process.env.NEXT_PUBLIC_XLM_TOKEN_CONTRACT_ID ?? "",
    },
    sep24AnchorBaseUrl: process.env.NEXT_PUBLIC_SEP24_ANCHOR_BASE_URL ?? "",
  };
}

export const env = getPublicEnv();

export function getIsSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabasePublishableKey);
}

export function assertSupabaseConfig() {
  if (!getIsSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }
}

export function assertTestnetConfig() {
  if (env.sorobanNetworkPassphrase !== STELLAR_TESTNET.networkPassphrase) {
    throw new Error("Circulo is configured for Stellar testnet only.");
  }
}

export function getTokenContractId(asset: string) {
  const contractId =
    env.tokenContractIds[asset as keyof typeof env.tokenContractIds] ?? "";
  if (!contractId) {
    throw new Error(`No testnet token contract is configured for ${asset}.`);
  }
  return contractId;
}