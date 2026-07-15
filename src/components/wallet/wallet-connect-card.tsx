"use client";

import { useState } from "react";
import { Loader2, Wallet, LogOut, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StellarWalletsKit } from "@/config/stellar";
import { useWallet } from "@/components/wallet/wallet-context";
import { FundTestnetButton } from "@/components/stellar/fund-testnet-button";
import { explorerAccountUrl } from "@/lib/stellar-testnet";

export function WalletConnectCard({ asset }: { asset?: string }) {
  const { address, hasTrustline, refresh } = useWallet();
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const result = await StellarWalletsKit.authModal();
      if (result?.address) {
        toast.success("Stellar testnet wallet connected.");
      }
    } catch {
      toast.error("Wallet connection was canceled.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    await StellarWalletsKit.disconnect();
  }

  const isConnected = Boolean(address);
  const missingTrustline = Boolean(address && asset && !hasTrustline(asset));

  return (
    <Card className="trust-ledger-surface">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="size-4 text-[var(--color-primary-default)]" />
          Stellar Testnet Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between">
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600">
            Testnet
          </span>
        </div>
        <p className="min-h-6 break-all rounded-lg border border-[var(--color-border-muted)] bg-[var(--color-background-muted)]/50 p-3 font-mono text-[11px] text-muted-foreground">
          {address ?? "Connect Freighter, xBull, or another supported Stellar wallet."}
        </p>

        {missingTrustline ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700">
            <p className="font-semibold">No {asset} trustline detected</p>
            <p className="mt-1 opacity-90">
              This wallet can&apos;t receive {asset} until it adds a trustline for it. Add one in
              your wallet, or use an XLM circle for testing (XLM needs no trustline).
            </p>
          </div>
        ) : null}

        {isConnected ? (
          <div className="flex flex-wrap gap-2">
            <FundTestnetButton address={address} onFunded={refresh} />
            <a
              href={explorerAccountUrl(address as string)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1 rounded-md border border-[var(--color-border-muted)] px-3 text-sm font-medium text-muted-foreground hover:text-primary"
            >
              View on explorer <ArrowUpRight className="size-3.5" />
            </a>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              <LogOut className="size-3.5" />
              Disconnect
            </Button>
          </div>
        ) : (
          <Button disabled={loading} onClick={handleConnect}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {loading ? "Connecting..." : "Connect Stellar Wallet"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
