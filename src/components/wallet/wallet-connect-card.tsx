"use client";

import { useEffect, useState } from "react";
import { Loader2, Wallet, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StellarWalletsKit, KitEventType } from "@/config/stellar";
import type { KitEventStateUpdated } from "@creit.tech/stellar-wallets-kit";

export function WalletConnectCard({
  walletAddress = null,
}: {
  walletAddress?: string | null;
}) {
  const [address, setAddress] = useState<string | null>(walletAddress);
  const [loading, setLoading] = useState(false);

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
      () => setAddress(null)
    );

    return () => {
      unsubscribeState();
      unsubscribeDisconnect();
    };
  }, []);

  async function handleConnect() {
    setLoading(true);
    try {
      const result = await StellarWalletsKit.authModal();
      if (result?.address) {
        setAddress(result.address);
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
    setAddress(null);
  }

  const isConnected = Boolean(address);

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
        {isConnected ? (
          <Button variant="outline" onClick={handleDisconnect}>
            <LogOut className="size-3.5" />
            Disconnect
          </Button>
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
