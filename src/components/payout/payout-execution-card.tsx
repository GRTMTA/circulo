"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardPayout } from "@/lib/dashboard/types";

export function PayoutExecutionCard({
  payout,
  recipientName,
  status,
}: {
  payout: DashboardPayout;
  recipientName: string;
  status: string;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>Round {payout.roundNumber} Payout</CardTitle></CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm text-muted-foreground">Recipient: <span className="font-semibold text-foreground">{recipientName}</span></p>
        <p className="text-sm text-muted-foreground">The contract pays members directly. Circulo does not custody funds.</p>
        {payout.txHash ? <p className="font-mono text-sm">{payout.txHash}</p> : null}
        <Button disabled={status !== "ready"} onClick={() => toast.success("Payout execution requested")}>Initiate Payout</Button>
      </CardContent>
    </Card>
  );
}

