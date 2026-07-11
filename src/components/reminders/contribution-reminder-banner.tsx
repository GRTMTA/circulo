"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function ContributionReminderBanner({
  amount,
  asset,
  dueAt,
  urgency,
}: {
  amount: number;
  asset: string;
  dueAt: string;
  urgency: "due_now" | "due_soon" | "overdue";
}) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <Alert variant={urgency === "overdue" ? "destructive" : "default"} className="relative">
      <AlertTitle>{urgency === "overdue" ? "Contribution overdue" : `Contribution ${urgency === "due_now" ? "due now" : "due soon"}`}</AlertTitle>
      <AlertDescription>{amount} {asset} due {new Date(dueAt).toLocaleString()}</AlertDescription>
      <Button className="absolute right-3 top-3" size="icon-sm" variant="ghost" onClick={() => setVisible(false)} aria-label="Dismiss reminder">
        <X className="size-4" />
      </Button>
    </Alert>
  );
}

