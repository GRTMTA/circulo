"use client";

import { useEffect, useState } from "react";
import { CircleDollarSign, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StellarWalletsKit, KitEventType, HORIZON_RPC_URL } from "@/config/stellar";
import type { KitEventStateUpdated } from "@creit.tech/stellar-wallets-kit";

export function WalletBalanceDisplay({ asset }: { asset: string }) {
  const [address, setAddress] = useState<string | null>(null);
  const [assetBalance, setAssetBalance] = useState(0);
  const [xlmBalance, setXlmBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    StellarWalletsKit.getAddress()
      .then((result) => setAddress(result?.address ?? null))
      .catch(() => setAddress(null));

    const unsubscribeState = StellarWalletsKit.on(
      KitEventType.STATE_UPDATED,
      (event: KitEventStateUpdated) => setAddress(event?.payload?.address ?? null)
    );
    const unsubscribeDisconnect = StellarWalletsKit.on(
      KitEventType.DISCONNECT,
      () => {
        setAddress(null);
        setHasFetched(false);
      }
    );

    return () => {
      unsubscribeState();
      unsubscribeDisconnect();
    };
  }, []);

  async function fetchBalances(walletAddress: string) {
    setLoading(true);
    try {
      const response = await fetch(`${HORIZON_RPC_URL}/accounts/${walletAddress}`);
      if (response.status === 404) {
        setAssetBalance(0);
        setXlmBalance(0);
        setHasFetched(true);
        return;
      }
      if (!response.ok) throw new Error("Horizon request failed");

      const data = await response.json();
      const native = data.balances.find(
        (balance: { asset_type: string }) => balance.asset_type === "native"
      );
      const selectedAsset = data.balances.find(
        (balance: { asset_code?: string }) => balance.asset_code === asset
      );
      setXlmBalance(native ? Number.parseFloat(native.balance) : 0);
      setAssetBalance(asset === "XLM" ? Number.parseFloat(native?.balance ?? "0") : Number.parseFloat(selectedAsset?.balance ?? "0"));
      setHasFetched(true);
    } catch (error) {
      console.error("Horizon balance fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!address) return;
    void fetchBalances(address);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void fetchBalances(address);
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [address, asset]);

  return (
    <Card className="trust-ledger-surface relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CircleDollarSign className="size-4 text-[var(--color-primary-default)]" />
          Testnet Wallet Balance
        </CardTitle>
        {address ? (
          <button
            onClick={() => void fetchBalances(address)}
            disabled={loading}
            className="text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
            aria-label="Refresh balances"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        ) : null}
      </CardHeader>
      <CardContent className="pt-2">
        {!address ? (
          <p className="text-sm text-muted-foreground">Connect a wallet to load live testnet balances.</p>
        ) : (
          <div className="space-y-3.5">
            <p className="text-3xl font-semibold tabular-nums">
              {loading && !hasFetched ? (
                <span className="flex items-center gap-2 text-lg text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Fetching balance...
                </span>
              ) : (
                `${assetBalance.toFixed(2)} ${asset}`
              )}
            </p>
            <div className="flex items-center justify-between border-t border-[var(--color-border-muted)] pt-3">
              <span className="text-sm font-semibold tabular-nums">{xlmBalance.toFixed(2)} XLM</span>
              <span className="text-[10px] uppercase text-muted-foreground">Fee reserve</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
