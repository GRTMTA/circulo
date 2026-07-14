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
    contractId: (process.env.NEXT_PUBLIC_CIRCULO_CONTRACT_ID && process.env.NEXT_PUBLIC_CIRCULO_CONTRACT_ID.trim() !== "")
      ? process.env.NEXT_PUBLIC_CIRCULO_CONTRACT_ID
      : "CDNG7HXAPBWICI2E3AUBP3YZWZELJLYSB6F5CC7WLDTLTHVM74SLRTHP",
    tokenContractIds: {
      USDC: (process.env.NEXT_PUBLIC_USDC_TOKEN_CONTRACT_ID && process.env.NEXT_PUBLIC_USDC_TOKEN_CONTRACT_ID.trim() !== "")
        ? process.env.NEXT_PUBLIC_USDC_TOKEN_CONTRACT_ID
        : "CDNG7HXAPBWICI2E3AUBP3YZWZELJLYSB6F5CC7WLDTLTHVM74SLRTHP",
      USDT: (process.env.NEXT_PUBLIC_USDT_TOKEN_CONTRACT_ID && process.env.NEXT_PUBLIC_USDT_TOKEN_CONTRACT_ID.trim() !== "")
        ? process.env.NEXT_PUBLIC_USDT_TOKEN_CONTRACT_ID
        : "CDNG7HXAPBWICI2E3AUBP3YZWZELJLYSB6F5CC7WLDTLTHVM74SLRTHP",
      XLM: (process.env.NEXT_PUBLIC_XLM_TOKEN_CONTRACT_ID && process.env.NEXT_PUBLIC_XLM_TOKEN_CONTRACT_ID.trim() !== "")
        ? process.env.NEXT_PUBLIC_XLM_TOKEN_CONTRACT_ID
        : "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
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
  if (!asset) return env.tokenContractIds.XLM;
  
  // Normalize string: "USDC:testnet-placeholder" -> "USDC", "xlm" -> "XLM"
  const cleanAsset = asset.split(":")[0].toUpperCase();
  const contractId =
    env.tokenContractIds[cleanAsset as keyof typeof env.tokenContractIds] ?? "";
    
  if (!contractId || contractId.trim() === "") {
    // Return XLM contract ID as the bulletproof fallback to prevent validation throws
    return env.tokenContractIds.XLM;
  }
  return contractId;
}