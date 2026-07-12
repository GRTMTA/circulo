import { StellarWalletsKit, Networks, SwkAppDarkTheme } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";

// Horizon RPC endpoint for the Stellar Testnet
export const HORIZON_RPC_URL = "https://horizon-testnet.stellar.org";

// Friendbot URL for requesting test tokens
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

// Initialize StellarWalletsKit statically on the client side
if (typeof window !== "undefined") {
  try {
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      theme: SwkAppDarkTheme,
      modules: defaultModules(),
    });
  } catch (error) {
    console.error("Failed to initialize StellarWalletsKit:", error);
  }
}

export { StellarWalletsKit, Networks };
