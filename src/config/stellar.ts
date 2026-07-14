import { StellarWalletsKit, Networks, SwkAppDarkTheme } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";

import { env, STELLAR_TESTNET } from "@/lib/env";

export const HORIZON_RPC_URL = env.horizonUrl;
export const FRIENDBOT_URL = STELLAR_TESTNET.friendbotUrl;

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

import { KitEventType } from "@creit.tech/stellar-wallets-kit";

export { StellarWalletsKit, Networks, KitEventType };
