"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { StellarWalletsKit, KitEventType, HORIZON_RPC_URL } from "@/config/stellar";
import type { KitEventStateUpdated } from "@creit.tech/stellar-wallets-kit";

interface AssetBalance {
  code: string;
  balance: number;
  issuer?: string;
}

interface WalletState {
  address: string | null;
  xlmBalance: number;
  balances: AssetBalance[];
  loading: boolean;
  hasFetched: boolean;
  refresh: () => void;
  getAssetBalance: (assetCode: string) => number;
  hasTrustline: (assetCode: string) => boolean;
}

const WalletContext = createContext<WalletState | null>(null);

/**
 * Single source of wallet address + balances. Replaces the per-component
 * Horizon pollers so several wallet widgets on one screen share one request
 * loop, and polling pauses while the tab is hidden.
 */
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [xlmBalance, setXlmBalance] = useState(0);
  const [balances, setBalances] = useState<AssetBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const addressRef = useRef<string | null>(null);

  const fetchBalances = useCallback(async () => {
    const current = addressRef.current;
    if (!current) return;
    setLoading(true);
    try {
      const response = await fetch(`${HORIZON_RPC_URL}/accounts/${current}`, {
        cache: "no-store",
      });
      if (response.status === 404) {
        setXlmBalance(0);
        setBalances([]);
        setHasFetched(true);
        return;
      }
      if (!response.ok) throw new Error("Horizon request failed");
      const data = (await response.json()) as {
        balances?: { asset_type: string; asset_code?: string; asset_issuer?: string; balance: string }[];
      };
      const native = data.balances?.find((b) => b.asset_type === "native");
      setXlmBalance(native ? Number.parseFloat(native.balance) : 0);
      setBalances(
        (data.balances ?? [])
          .filter((b) => b.asset_type !== "native" && b.asset_code)
          .map((b) => ({
            code: b.asset_code as string,
            balance: Number.parseFloat(b.balance),
            issuer: b.asset_issuer,
          }))
      );
      setHasFetched(true);
    } catch (error) {
      console.error("Horizon balance fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    StellarWalletsKit.getAddress()
      .then((result) => {
        const addr = result?.address ?? null;
        addressRef.current = addr;
        setAddress(addr);
      })
      .catch(() => setAddress(null));

    const unsubscribeState = StellarWalletsKit.on(
      KitEventType.STATE_UPDATED,
      (event: KitEventStateUpdated) => {
        const addr = event?.payload?.address ?? null;
        addressRef.current = addr;
        setAddress(addr);
        setHasFetched(false);
      }
    );
    const unsubscribeDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      addressRef.current = null;
      setAddress(null);
      setXlmBalance(0);
      setBalances([]);
      setHasFetched(false);
    });

    return () => {
      unsubscribeState();
      unsubscribeDisconnect();
    };
  }, []);

  useEffect(() => {
    if (!address) return;
    void fetchBalances();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void fetchBalances();
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [address, fetchBalances]);

  const getAssetBalance = useCallback(
    (assetCode: string) => {
      const normalized = assetCode.split(":")[0].toUpperCase();
      if (normalized === "XLM") return xlmBalance;
      return balances.find((b) => b.code === normalized)?.balance ?? 0;
    },
    [balances, xlmBalance]
  );

  const hasTrustline = useCallback(
    (assetCode: string) => {
      const normalized = assetCode.split(":")[0].toUpperCase();
      if (normalized === "XLM") return true;
      return balances.some((b) => b.code === normalized);
    },
    [balances]
  );

  return (
    <WalletContext.Provider
      value={{
        address,
        xlmBalance,
        balances,
        loading,
        hasFetched,
        refresh: fetchBalances,
        getAssetBalance,
        hasTrustline,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return ctx;
}
