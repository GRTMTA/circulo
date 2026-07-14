"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptAgreementAction } from "@/app/dashboard/actions";
import { StellarWalletsKit } from "@/config/stellar";
import { env, getTokenContractId } from "@/lib/env";
import {
  submitSignedTransaction,
  triggerPostCollateralOnChain,
} from "@/services/contractService";

export function MemberAgreementScreen({
  circleId,
  circleName,
  rules,
  collateralAmount,
  contributionAsset,
  memberWalletAddress,
  accepted = false,
}: {
  circleId: string;
  circleName: string;
  rules: string[];
  collateralAmount: number;
  contributionAsset: string;
  memberWalletAddress: string;
  accepted?: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(accepted);
  const [submitting, setSubmitting] = useState(false);

  async function handleAccept() {
    setSubmitting(true);
    try {
      const addressResult = await StellarWalletsKit.getAddress();
      const memberAddress = addressResult?.address;
      if (!memberAddress) throw new Error("Connect a Stellar testnet wallet first.");
      if (memberAddress.toUpperCase() !== memberWalletAddress.toUpperCase()) {
        throw new Error("Connect the Stellar wallet that received this invitation.");
      }
      if (!env.contractId) {
        throw new Error("NEXT_PUBLIC_CIRCULO_CONTRACT_ID is not configured.");
      }

      const tokenContractId = getTokenContractId(contributionAsset);
      const { txXdr } = await triggerPostCollateralOnChain(
        memberAddress,
        env.contractId,
        circleId,
        tokenContractId
      );
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
        address: memberAddress,
        networkPassphrase: env.sorobanNetworkPassphrase,
      });
      const { hash } = await submitSignedTransaction(signedTxXdr);
      const result = await acceptAgreementAction(circleId, undefined, hash);

      if (!result.success) throw new Error(result.error || "Failed to join circle.");

      toast.success("Agreement accepted and collateral posted on testnet.");
      router.push(`/dashboard/${circleId}`);
      router.refresh();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast.error(error.message || "Failed to join circle.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="trust-ledger-surface">
      <CardHeader>
        <CardTitle>Before joining {circleName}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-3">
          {rules.map((rule) => (
            <div key={rule} className="flex gap-3 rounded-xl border border-border bg-white p-4 text-sm leading-6">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{rule}</span>
            </div>
          ))}
        </div>
        <label className="flex cursor-pointer select-none items-start gap-3 rounded-xl border border-border bg-white p-4 text-sm font-semibold">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            disabled={accepted || submitting}
            className="mt-1 size-4 accent-[var(--color-primary-default)]"
          />
          I understand and accept these circle rules and the {collateralAmount} {contributionAsset} testnet collateral transaction.
        </label>
        <Button disabled={!checked || accepted || submitting} onClick={handleAccept}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {accepted
            ? "Agreement Accepted"
            : submitting
              ? "Submitting on testnet..."
              : "Accept & Post Collateral"}
        </Button>
      </CardContent>
    </Card>
  );
}
