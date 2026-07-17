"use client";

import { useState } from "react";
import { Loader2, WalletCards, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StellarWalletsKit } from "@/config/stellar";
import { env, getTokenContractId } from "@/lib/env";
import {
  ContributionAlreadyPaidError,
  submitSignedTransaction,
  triggerContributeOnChain,
} from "@/services/contractService";
import { useWallet } from "@/components/wallet/wallet-context";
import { explorerTxUrl } from "@/lib/stellar-testnet";
import { recordContributionPaymentAction } from "@/app/dashboard/actions";

type PayStatus = "idle" | "signing" | "submitting" | "confirming" | "paid";

const STATUS_COPY: Record<PayStatus, string> = {
  idle: "",
  signing: "Awaiting signature...",
  submitting: "Submitting to testnet...",
  confirming: "Confirming on-chain...",
  paid: "Paid on testnet",
};

export function WalletPayButton({
  circleId,
  amount,
  asset,
  dueDate,
  roundNumber,
  status,
}: {
  circleId: string;
  amount: number;
  asset: string;
  dueDate: string | null;
  roundNumber?: number;
  status: "idle" | "paying" | "verifying" | "paid";
}) {
  const { address, getAssetBalance, hasTrustline, refresh } = useWallet();
  const [paymentStatus, setPaymentStatus] = useState<PayStatus>(
    status === "paid" ? "paid" : "idle"
  );
  const [txHash, setTxHash] = useState<string | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const balance = getAssetBalance(asset);
  const missingTrustline = Boolean(address && !hasTrustline(asset));
  const insufficient = Boolean(address && balance < amount);
  const busy =
    paymentStatus === "signing" ||
    paymentStatus === "submitting" ||
    paymentStatus === "confirming";

  async function handlePay() {
    try {
      const addressResult = await StellarWalletsKit.getAddress();
      const memberAddress = addressResult?.address;
      if (!memberAddress) throw new Error("Connect a Stellar testnet wallet first.");
      if (!env.contractId) {
        throw new Error("The Circulo contract is not configured.");
      }

      const tokenContractId = getTokenContractId(asset);
      setPaymentStatus("signing");
      const { txXdr } = await triggerContributeOnChain(
        memberAddress,
        env.contractId,
        circleId,
        tokenContractId
      );
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
        address: memberAddress,
        networkPassphrase: env.sorobanNetworkPassphrase,
      });

      setPaymentStatus("submitting");
      const submitPromise = submitSignedTransaction(signedTxXdr);
      setPaymentStatus("confirming");
      const { hash } = await submitPromise;

      const recorded = await recordContributionPaymentAction(circleId, hash);
      if (!recorded.success) {
        throw new Error(recorded.error || "Contribution was confirmed but could not be recorded.");
      }

      setTxHash(hash);
      setPaymentStatus("paid");
      setConfirmationOpen(true);
      toast.success("Testnet contribution confirmed.");
      refresh();
    } catch (error) {
      if (error instanceof ContributionAlreadyPaidError) {
        if (error.txHash) {
          const recorded = await recordContributionPaymentAction(circleId, error.txHash);
          if (recorded.success) {
            setTxHash(error.txHash);
            setPaymentStatus("paid");
            setConfirmationOpen(true);
            toast.success("This contribution was already paid and has been synced.");
            refresh();
            return;
          }
        }
        setPaymentStatus("paid");
        toast.info("This contribution is already paid on-chain. Refresh the dashboard.");
        refresh();
        return;
      }
      setPaymentStatus("idle");
      toast.error(error instanceof Error ? error.message : "Contribution failed.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <WalletCards className="size-4 text-primary" /> Contribution Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <p className="text-3xl font-semibold tabular-nums">{amount} {asset}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {dueDate
              ? `Due ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric" }).format(new Date(dueDate))}`
              : "No due date scheduled"}
          </p>
        </div>

        {missingTrustline ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700">
            Add a {asset} trustline in your wallet before contributing.
          </p>
        ) : insufficient && paymentStatus !== "paid" ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700">
            Balance is {balance.toFixed(2)} {asset}. Fund your wallet to cover {amount} {asset}.
          </p>
        ) : null}

        <Button
          disabled={busy || paymentStatus === "paid" || missingTrustline || insufficient}
          onClick={handlePay}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {paymentStatus === "idle" ? `Pay ${amount} ${asset}` : STATUS_COPY[paymentStatus]}
        </Button>

        {txHash ? (
          <a
            href={explorerTxUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
          >
            View transaction on Stellar Expert <ArrowUpRight className="size-3" />
          </a>
        ) : null}
      </CardContent>
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-7" />
            </div>
            <DialogTitle className="text-center">Contribution confirmed</DialogTitle>
            <DialogDescription className="text-center">
              Your payment was transferred into the circle escrow on Stellar Testnet.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Amount</span><strong>{amount} {asset}</strong></div>
            <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Target round</span><strong>Round {roundNumber ?? "current"}</strong></div>
            <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Status</span><strong className="text-emerald-700">Confirmed</strong></div>
          </div>
          {txHash ? (
            <a href={explorerTxUrl(txHash)} target="_blank" rel="noopener noreferrer" className="text-center text-sm text-primary underline-offset-4 hover:underline">
              View confirmed transaction on Stellar Expert
            </a>
          ) : null}
          <DialogFooter>
            <Button onClick={() => setConfirmationOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
