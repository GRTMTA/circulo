"use client";

import React, { useState, useEffect } from "react";
import { LogOut, Wallet, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { StellarWalletsKit, KitEventType } from "@/config/stellar";
import type { KitEventStateUpdated } from "@creit.tech/stellar-wallets-kit";

interface ConnectWalletButtonProps {
  compact?: boolean;
}

export function ConnectWalletButton({ compact = false }: ConnectWalletButtonProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [xlmBalance, setXlmBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Synchronize state across all kit instances/components in real-time
  useEffect(() => {
    StellarWalletsKit.getAddress()
      .then((res) => {
        if (res?.address) {
          setAddress(res.address);
          setShowWarning(true);
        }
      })
      .catch(() => {});

    const unsubState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event: KitEventStateUpdated) => {
      if (event?.payload?.address) {
        setAddress(event.payload.address);
        setShowWarning(true);
      }
    });

    const unsubDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      setAddress(null);
      setShowWarning(false);
      setUsdcBalance(0);
      setXlmBalance(0);
    });

    return () => {
      unsubState();
      unsubDisconnect();
    };
  }, []);

  const fetchBalances = async (walletAddress: string) => {
    setBalanceLoading(true);
    try {
      const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${walletAddress}`);
      if (res.status === 404) {
        setUsdcBalance(0);
        setXlmBalance(0);
        return;
      }
      const data = await res.json();
      
      const native = data.balances.find((b: { asset_type: string }) => b.asset_type === "native");
      setXlmBalance(native ? parseFloat(native.balance) : 0);

      const usdc = data.balances.find((b: { asset_code?: string }) => b.asset_code === "USDC");
      setUsdcBalance(usdc ? parseFloat(usdc.balance) : 0);
    } catch (error) {
      console.error("Horizon balance fetch failed:", error);
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      Promise.resolve().then(() => fetchBalances(address));

      // Poll balance every 10 seconds while connected
      const interval = setInterval(() => {
        fetchBalances(address);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [address]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await StellarWalletsKit.authModal();
      if (res && res.address) {
        setAddress(res.address);
        setShowWarning(true);
        console.log("Stellar Wallet connected successfully! Address:", res.address);
      }
    } catch (error) {
      console.error("Wallet connection flow interrupted:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await StellarWalletsKit.disconnect();
      setAddress(null);
      setShowWarning(false);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {!address ? (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 h-10 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-[var(--color-primary-default)] to-indigo-600 hover:from-[var(--color-primary-hover)] hover:to-indigo-700 transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            <Wallet className="size-3.5" />
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
        ) : (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-background-muted)]/40 backdrop-blur text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
              {balanceLoading && usdcBalance === 0 ? (
                <Loader2 className="size-3 animate-spin text-[var(--color-primary-default)]" />
              ) : (
                <span className="text-[var(--color-text-default)] tabular-nums">{usdcBalance.toFixed(2)} USDC</span>
              )}
              <span className="opacity-30">|</span>
              <span className="tabular-nums">{xlmBalance.toFixed(1)} XLM</span>
            </div>
            
            <div className="flex items-center gap-2 border-l border-[var(--color-border-muted)] pl-3">
              <div className="flex items-center gap-1 font-mono font-medium text-muted-foreground">
                <CheckCircle className="size-3.5 text-[var(--color-success-default)]" />
                {formatAddress(address)}
              </div>
              <button
                onClick={handleDisconnect}
                className="text-muted-foreground hover:text-[var(--color-error-default)] hover:bg-[var(--color-error-muted)] p-1 rounded-md transition-all"
                title="Disconnect Wallet"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-md">
      {!address ? (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="flex items-center justify-center gap-2.5 w-full min-h-11 px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-[var(--color-primary-default)] to-indigo-600 hover:from-[var(--color-primary-hover)] hover:to-indigo-700 transition-all duration-200 shadow-[0_12px_24px_-10px_rgba(99,102,241,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          <Wallet className="size-4" />
          {loading ? "Opening Wallet Modal..." : "Connect Stellar Wallet"}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border border-[var(--color-border-muted)] bg-[var(--color-background-muted)]/50 backdrop-blur">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-default)]">
                <CheckCircle className="size-4 text-[var(--color-success-default)]" />
                <span className="font-mono font-medium">{formatAddress(address)}</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold mt-1">
                {usdcBalance.toFixed(2)} USDC &bull; {xlmBalance.toFixed(2)} XLM
              </div>
            </div>
            
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-[var(--color-error-default)] hover:bg-[var(--color-error-muted)] transition-colors"
              aria-label="Disconnect wallet"
            >
              <LogOut className="size-3.5" />
              Disconnect
            </button>
          </div>
        </div>
      )}

      {showWarning && (
        <div className="flex gap-2.5 p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500 text-xs leading-relaxed animate-enter-soft">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Sandbox Testnet Active</p>
            <p className="opacity-90">
              Ensure your wallet extension is set to **Testnet**. If your balance is 0, request free test funds via the{" "}
              <a
                href="https://laboratory.stellar.org/#account-creator?network=testnet"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold hover:text-amber-400 transition-colors"
              >
                Testnet Friendbot
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
