"use client";

import { useState } from "react";
import { Loader2, Send, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StellarWalletsKit } from "@/config/stellar";
import { env, getTokenContractId } from "@/lib/env";
import {
  submitSignedTransaction,
  triggerExecutePayoutOnChain,
} from "@/services/contractService";
import { recordRoundPayoutAction } from "@/app/dashboard/actions";
import { explorerTxUrl } from "@/lib/stellar-testnet";
import type { DashboardMember } from "@/lib/dashboard/types";

type PayoutStatus = "idle" | "signing" | "submitting" | "confirming" | "done";

const COPY: Record<PayoutStatus, string> = {
  idle: "Execute round payout",
  signing: "Awaiting signature...",
  submitting: "Submitting to testnet...",
  confirming: "Confirming on-chain...",
  done: "Payout released",
};

/**
 * Creator-only control to release the current round's pool to the recipient
 * fixed by the on-chain payout order. The contract enforces that all members
 * have contributed and advances the round; this component mirrors that state
 * into Supabase after confirmation.
 */
export function RoundPayoutPanel({
  circleId,
  circleAsset,
  currentRound,
  recipient,
  allContributed,
}: {
  circleId: string;
  circleAsset: string;
  currentRound: number;
  recipient: DashboardMember | null;
  allContributed: boolean;
}) {
  const [status, setStatus] = useState<PayoutStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);

  const busy = status === "signing" || status === "submitting" || status === "confirming";

  async function handlePayout() {
    try {
      const addressResult = await StellarWalletsKit.getAddress();
      const adminAddress = addressResult?.address;
      if (!adminAddress) throw new Error("Connect the creator's testnet wallet first.");
      if (!env.contractId) throw new Error("The Circulo contract is not configured.");
      if (!recipient) throw new Error("No recipient is scheduled for this round.");

      const tokenContractId = getTokenContractId(circleAsset);
      setStatus("signing");
      const { txXdr } = await triggerExecutePayoutOnChain(
        adminAddress,
        env.contractId,
        circleId,
        tokenContractId
      );
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
        address: adminAddress,
        networkPassphrase: env.sorobanNetworkPassphrase,
      });

      setStatus("submitting");
      const submit = submitSignedTransaction(signedTxXdr);
      setStatus("confirming");
      const { hash } = await submit;

      const result = await recordRoundPayoutAction(circleId, recipient.id, hash);
      if (!result.success) throw new Error(result.error || "Failed to record payout.");

      setTxHash(hash);
      setStatus("done");
      toast.success(
        result.completed ? "Final payout released. Circle completed." : "Round payout released."
      );
    } catch (error) {
      setStatus("idle");
      toast.error(error instanceof Error ? error.message : "Payout failed.");
    }
  }

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-white p-4">
      <div>
        <p className="font-semibold">Round {currentRound} payout</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {recipient
            ? `Recipient: ${recipient.displayName}. The contract sends the full pool to the address locked for this round.`
            : "No recipient scheduled for this round."}
        </p>
      </div>

      {!allContributed ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700">
          Every member must contribute for round {currentRound} before the payout can be released.
          The contract will reject an early payout.
        </p>
      ) : null}

      <Button
        disabled={busy || status === "done" || !recipient || !allContributed}
        onClick={handlePayout}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {COPY[status]}
      </Button>

      {txHash ? (
        <a
          href={explorerTxUrl(txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
        >
          View payout transaction <ArrowUpRight className="size-3" />
        </a>
      ) : null}
    </div>
  );
}
