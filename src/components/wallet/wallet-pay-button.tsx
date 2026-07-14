"use client";

import { useState } from "react";
import { Loader2, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StellarWalletsKit } from "@/config/stellar";
import { env, getTokenContractId } from "@/lib/env";
import {
  submitSignedTransaction,
  triggerContributeOnChain,
} from "@/services/contractService";

export function WalletPayButton({
  amount,
  asset,
  dueDate,
  status,
}: {
  amount: number;
  asset: string;
  dueDate: string | null;
  status: "idle" | "paying" | "verifying" | "paid";
}) {
  const [paymentStatus, setPaymentStatus] = useState(status);

  async function handlePay() {
    setPaymentStatus("paying");
    try {
      const addressResult = await StellarWalletsKit.getAddress();
      const memberAddress = addressResult?.address;
      if (!memberAddress) throw new Error("Connect a Stellar testnet wallet first.");
      if (!env.contractId) {
        throw new Error("NEXT_PUBLIC_CIRCULO_CONTRACT_ID is not configured.");
      }

      const tokenContractId = getTokenContractId(asset);
      const stroops = BigInt(Math.round(amount * 10_000_000));
      const { txXdr } = await triggerContributeOnChain(
        memberAddress,
        env.contractId,
        tokenContractId,
        stroops.toString()
      );
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
        address: memberAddress,
        networkPassphrase: env.sorobanNetworkPassphrase,
      });

      setPaymentStatus("verifying");
      const { hash } = await submitSignedTransaction(signedTxXdr);
      setPaymentStatus("paid");
      toast.success(`Testnet contribution confirmed: ${hash.slice(0, 10)}…`);
    } catch (error) {
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
        <Button
          disabled={paymentStatus === "paying" || paymentStatus === "verifying" || paymentStatus === "paid"}
          onClick={handlePay}
        >
          {paymentStatus === "paying" || paymentStatus === "verifying" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          {paymentStatus === "paid"
            ? "Paid on testnet"
            : paymentStatus === "verifying"
              ? "Confirming..."
              : paymentStatus === "paying"
                ? "Awaiting signature..."
                : `Pay ${amount} ${asset}`}
        </Button>
      </CardContent>
    </Card>
  );
}

