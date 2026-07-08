export function getPublicEnv() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabasePublishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    sorobanRpcUrl:
      process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ??
      "https://soroban-testnet.stellar.org",
    sorobanNetworkPassphrase:
      process.env.NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015",
    contractId: process.env.NEXT_PUBLIC_CIRCULO_CONTRACT_ID ?? "",
    stablecoinAsset:
      process.env.NEXT_PUBLIC_STABLECOIN_ASSET ?? "USDC:testnet-placeholder",
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
