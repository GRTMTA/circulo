"use client";

import { CircleDollarSign, Loader2, RefreshCw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/components/wallet/wallet-context";

export function WalletBalanceDisplay({ asset }: { asset: string }) {
  const { address, xlmBalance, getAssetBalance, loading, hasFetched, refresh } = useWallet();
  const assetBalance = getAssetBalance(asset);

  return (
    <Card className="trust-ledger-surface relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CircleDollarSign className="size-4 text-[var(--color-primary-default)]" />
          Testnet Wallet Balance
        </CardTitle>
        {address ? (
          <button
            onClick={refresh}
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
                `${assetBalance.toFixed(4)} ${asset}`
              )}
            </p>
            <div className="flex items-center justify-between border-t border-[var(--color-border-muted)] pt-3">
              <span className="text-sm font-semibold tabular-nums">{xlmBalance.toFixed(4)} XLM</span>
              <span className="text-[10px] uppercase text-muted-foreground">Fee reserve</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
