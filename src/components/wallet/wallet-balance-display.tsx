"use client";

import { useEffect, useState } from "react";
import { CircleDollarSign, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StellarWalletsKit, KitEventType } from "@/config/stellar";
import type { KitEventStateUpdated } from "@creit.tech/stellar-wallets-kit";

export function WalletBalanceDisplay({
  balance: initialBalance,
  asset: initialAsset,
  network: initialNetwork,
}: {
  balance: number;
  asset: string;
  network: string;
}) {
  const [address, setAddress] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [xlmBalance, setXlmBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Synchronize connected wallet state across components
  useEffect(() => {
    StellarWalletsKit.getAddress()
      .then((res) => {
        if (res?.address) setAddress(res.address);
      })
      .catch(() => {});

    const unsubState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event: KitEventStateUpdated) => {
      if (event?.payload?.address) {
        setAddress(event.payload.address);
      }
    });

    const unsubDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      setAddress(null);
      setHasFetched(false);
    });

    return () => {
      unsubState();
      unsubDisconnect();
    };
  }, []);

  const fetchBalances = async (walletAddress: string) => {
    setLoading(true);
    try {
      const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${walletAddress}`);
      if (res.status === 404) {
        // Account not yet activated on-chain
        setUsdcBalance(0);
        setXlmBalance(0);
        setHasFetched(true);
        return;
      }
      const data = await res.json();
      
      const native = data.balances.find((b: { asset_type: string }) => b.asset_type === "native");
      setXlmBalance(native ? parseFloat(native.balance) : 0);

      const usdc = data.balances.find((b: { asset_code?: string }) => b.asset_code === "USDC");
      setUsdcBalance(usdc ? parseFloat(usdc.balance) : 0);
      setHasFetched(true);
    } catch (error) {
      console.error("Horizon balance fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      // Run it inside a microtask to avoid synchronous setState inside the effect body
      Promise.resolve().then(() => fetchBalances(address));

      // Set up simple polling every 8 seconds to capture deposits/cash-ins
      const interval = setInterval(() => {
        fetchBalances(address);
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [address]);

  const isConnected = !!address;

  return (
    <Card className="trust-ledger-surface relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CircleDollarSign className="size-4 text-[var(--color-primary-default)]" />
          {isConnected ? "Live Wallet Balance" : "Stablecoin Balance (Mock)"}
        </CardTitle>
        {isConnected && (
          <button
            onClick={() => fetchBalances(address)}
            disabled={loading}
            className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            aria-label="Refresh balances"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        {!isConnected ? (
          <div>
            <p className="text-3xl font-semibold tabular-nums text-[var(--color-text-default)]">
              {initialBalance.toFixed(2)} {initialAsset}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Mocking {initialNetwork} network session</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div>
              <p className="text-3xl font-semibold tabular-nums text-[var(--color-text-default)]">
                {loading && !hasFetched ? (
                  <span className="flex items-center gap-2 text-lg text-muted-foreground font-medium">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    Fetching balance...
                  </span>
                ) : (
                  `${usdcBalance.toFixed(2)} USDC`
                )}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Stablecoin Asset</p>
            </div>
            
            <div className="border-t border-[var(--color-border-muted)] pt-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold tabular-nums text-[var(--color-text-default)]">
                  {xlmBalance.toFixed(2)} XLM
                </p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Gas / Fee Reserve</p>
              </div>
              {xlmBalance === 0 && (
                <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Needs Activation
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
