"use client";

import { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StellarWalletsKit } from "@/config/stellar";
import { env } from "@/lib/env";
import {
  submitSignedTransaction,
  triggerSlashCollateralOnChain,
} from "@/services/contractService";
import { recordCollateralSlashAction } from "@/app/dashboard/actions";
import type { DashboardMember } from "@/lib/dashboard/types";

/**
 * Creator-only default-protection control. Slashing is only valid when a member
 * has actually missed the current round's contribution; the contract enforces
 * that rule, this UI just triggers and records it.
 */
export function SlashMemberButton({
  circleId,
  member,
  slashPercentage,
}: {
  circleId: string;
  member: DashboardMember;
  slashPercentage: number;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSlash() {
    setLoading(true);
    try {
      const addressResult = await StellarWalletsKit.getAddress();
      const adminAddress = addressResult?.address;
      if (!adminAddress) throw new Error("Connect the creator's testnet wallet first.");
      if (!env.contractId) throw new Error("The Circulo contract is not configured.");

      const { txXdr } = await triggerSlashCollateralOnChain(
        adminAddress,
        env.contractId,
        circleId,
        member.walletAddress,
        slashPercentage
      );
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
        address: adminAddress,
        networkPassphrase: env.sorobanNetworkPassphrase,
      });
      const { hash } = await submitSignedTransaction(signedTxXdr);

      // The slashed amount is derived on-chain; we mirror an estimate for display.
      const result = await recordCollateralSlashAction(circleId, member.id, member.slashedAmount, hash);
      if (!result.success) throw new Error(result.error || "Failed to record slash.");

      toast.success(`${member.displayName}'s collateral was slashed.`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Slash failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 text-[var(--color-error-default)] hover:bg-[var(--color-error-muted)] hover:text-[var(--color-error-default)]"
        onClick={() => setOpen(true)}
      >
        <ShieldAlert className="size-4" />
        Slash
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Slash {member.displayName}&apos;s collateral</DialogTitle>
            <DialogDescription>
              This forfeits {slashPercentage}% of their posted collateral into the pool. The
              contract only allows this if they missed the current round&apos;s contribution, and it
              can be done once. This action is permanent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              className="bg-[var(--color-error-default)] text-white hover:opacity-90"
              onClick={handleSlash}
              disabled={loading}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {loading ? "Slashing..." : "Confirm slash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
