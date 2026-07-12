"use client";

import React, { useState, useEffect } from "react";
import { LogOut, Wallet, CheckCircle, AlertTriangle } from "lucide-react";
import { StellarWalletsKit } from "@/config/stellar";

export function ConnectWalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Check if there was a previously saved session in localStorage/memory on mount
  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        const activeAddress = await StellarWalletsKit.getAddress();
        if (activeAddress && activeAddress.address) {
          setAddress(activeAddress.address);
          setShowWarning(true);
        }
      } catch {
        // No saved session found
      }
    };
    checkSavedSession();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      // Triggers the kit's interactive Modal overlay to select wallet
      const res = await StellarWalletsKit.authModal();
      if (res && res.address) {
        setAddress(res.address);
        setShowWarning(true);
        console.log("Stellar Wallet connected successfully! Public Key:", res.address);
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
      console.log("Stellar Wallet disconnected.");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

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
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-background-muted)]/50 backdrop-blur">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-default)]">
              <CheckCircle className="size-4 text-[var(--color-success-default)]" />
              <span className="font-mono font-medium">{formatAddress(address)}</span>
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
