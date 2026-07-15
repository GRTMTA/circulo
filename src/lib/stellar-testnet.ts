import { env, STELLAR_TESTNET } from "@/lib/env";

/**
 * Testnet-only helpers: block-explorer links, Friendbot funding, and trustline
 * checks. These exist to remove first-run friction and make on-chain activity
 * verifiable during a testnet demo. They are intentionally not for mainnet.
 */

const EXPLORER_BASE = "https://stellar.expert/explorer/testnet";

export function explorerTxUrl(txHash: string): string {
  return `${EXPLORER_BASE}/tx/${txHash}`;
}

export function explorerAccountUrl(address: string): string {
  return `${EXPLORER_BASE}/account/${address}`;
}

export function explorerContractUrl(contractId: string): string {
  return `${EXPLORER_BASE}/contract/${contractId}`;
}

/** Fund a testnet account with XLM via Friendbot. Safe to call repeatedly. */
export async function fundWithFriendbot(
  address: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(
      `${STELLAR_TESTNET.friendbotUrl}/?addr=${encodeURIComponent(address)}`
    );
    if (res.ok) {
      return { success: true, message: "Testnet XLM funded. Balances refresh shortly." };
    }
    // Friendbot returns 400 when the account is already funded.
    if (res.status === 400) {
      return {
        success: false,
        message: "This account already has testnet XLM (Friendbot funds each account once).",
      };
    }
    return { success: false, message: "Friendbot request failed. Try again in a moment." };
  } catch {
    return { success: false, message: "Could not reach Friendbot. Check your connection." };
  }
}

interface HorizonBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

/**
 * Returns whether the account exists on testnet and whether it holds a
 * trustline for the given asset code. Native XLM never needs a trustline.
 */
export async function checkAccountAsset(
  address: string,
  assetCode: string
): Promise<{ accountFunded: boolean; hasTrustline: boolean }> {
  const normalized = assetCode.split(":")[0].toUpperCase();
  if (normalized === "XLM") {
    // XLM is native; a funded account can always receive it.
    try {
      const res = await fetch(`${env.horizonUrl}/accounts/${address}`);
      return { accountFunded: res.ok, hasTrustline: res.ok };
    } catch {
      return { accountFunded: false, hasTrustline: false };
    }
  }

  try {
    const res = await fetch(`${env.horizonUrl}/accounts/${address}`);
    if (!res.ok) {
      return { accountFunded: false, hasTrustline: false };
    }
    const data = (await res.json()) as { balances?: HorizonBalance[] };
    const hasTrustline = Boolean(
      data.balances?.some(
        (b) => b.asset_type !== "native" && b.asset_code === normalized
      )
    );
    return { accountFunded: true, hasTrustline };
  } catch {
    return { accountFunded: false, hasTrustline: false };
  }
}
