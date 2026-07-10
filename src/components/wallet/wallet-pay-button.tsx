"use client";

import { useState } from "react";
import { Loader2, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WalletPayButton({
  amount,
  asset,
  dueDate,
  status,
}: {
  amount: number;
  asset: string;
  dueDate: string;
  status: "idle" | "paying" | "verifying" | "paid";
}) {
  const [paymentStatus, setPaymentStatus] = useState(status);

  return (
    <Card>
      <CardHeader>
        <CardTitle><WalletCards className="size-4 text-primary" /> Contribution Payment</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <p className="text-3xl font-semibold tabular-nums">{amount} {asset}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Due {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric" }).format(new Date(dueDate))}
          </p>
        </div>
        <Button
          disabled={paymentStatus === "paying" || paymentStatus === "paid"}
          onClick={() => {
            setPaymentStatus("verifying");
            toast.success("Transaction submitted");
          }}
        >
          {paymentStatus === "paying" || paymentStatus === "verifying" ? <Loader2 className="size-4 animate-spin" /> : null}
          {paymentStatus === "paid" ? "Paid" : paymentStatus === "verifying" ? "Verifying..." : `Pay ${amount} ${asset}`}
        </Button>
      </CardContent>
    </Card>
  );
}

