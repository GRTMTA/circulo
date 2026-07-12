"use client";

import { useEffect, useState } from "react";
import { Loader2, Wallet, LogOut, ArrowUpRight, HelpCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StellarWalletsKit, KitEventType } from "@/config/stellar";
import { handleMockCashIn } from "@/utils/anchor";
import type { KitEventStateUpdated } from "@creit.tech/stellar-wallets-kit";

export function WalletConnectCard({
  walletAddress,
}: {
  status: "connected" | "disconnected" | "connecting";
  walletAddress: string | null;
}) {
  const [address, setAddress] = useState<string | null>(walletAddress);
  const [loading, setLoading] = useState(false);

  // Synchronize state across all kit instances/components in real-time
  useEffect(() => {
    StellarWalletsKit.getAddress()
      .then((res) => {
        if (res?.address) setAddress(res.address);
      })
      .catch(() => {});

    // Listen for state changes (e.g. connected in navbar button)
    const unsubState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event: KitEventStateUpdated) => {
      if (event?.payload?.address) {
        setAddress(event.payload.address);
      }
    });

    const unsubDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      setAddress(null);
    });

    return () => {
      unsubState();
      unsubDisconnect();
    };
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await StellarWalletsKit.authModal();
      if (res && res.address) {
        setAddress(res.address);
        toast.success("Stellar Wallet connected successfully!");
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
      toast.error("Wallet connection was canceled.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await StellarWalletsKit.disconnect();
      setAddress(null);
      toast.info("Wallet disconnected.");
    } catch (error) {
      console.error("Disconnect failed:", error);
    }
  };

  const isConnected = !!address;

  return (
    <Card className="trust-ledger-surface">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="size-4 text-[var(--color-primary-default)]" />
          Stellar Sandbox Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between">
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          {isConnected && (
            <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Testnet Active
            </span>
          )}
        </div>
        
        <p className="min-h-6 font-mono text-[11px] text-muted-foreground break-all p-3 rounded-lg bg-[var(--color-background-muted)]/50 border border-[var(--color-border-muted)]">
          {address ?? "No wallet connected. Use the Freighter or xBull extension."}
        </p>

        <div className="flex flex-col gap-2">
          {!isConnected ? (
            <Button
              variant="default"
              disabled={loading}
              onClick={handleConnect}
              className="w-full justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Connecting Wallet...
                </>
              ) : (
                "Connect Stellar Wallet"
              )}
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="w-full flex items-center justify-center gap-2"
              >
                <LogOut className="size-3.5" />
                Disconnect
              </Button>
              
              <Button
                variant="default"
                onClick={() => handleMockCashIn(address)}
                className="w-full flex items-center justify-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-[0_8px_16px_-8px_rgba(16,185,129,0.5)]"
              >
                Cash In via Anchor
                <ArrowUpRight className="size-3.5" />
              </Button>
            </div>
          )}
        </div>

        {isConnected && (
          <div className="text-[10px] text-muted-foreground flex gap-1.5 items-start mt-1 leading-relaxed bg-[var(--color-background-muted)]/20 p-2 rounded-lg border border-[var(--color-border-muted)]/30">
            <HelpCircle className="size-3.5 shrink-0 mt-0.5 text-amber-500" />
            <span>
              Clicking **Cash In** opens Stellar&apos;s reference bank simulation portal to fund your sandbox wallet with mock USDC.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
