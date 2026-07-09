"use client";

import { Bell, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DashboardRound } from "@/lib/dashboard/types";

export function CalendarQuickActionBar({
  currentRound,
  paidCount,
  totalCount,
  onPayNow,
  onSendReminders,
  role,
}: {
  currentRound: DashboardRound;
  paidCount: number;
  totalCount: number;
  onPayNow?: () => void;
  onSendReminders?: () => void;
  role: "creator" | "member";
}) {
  const pendingCount = totalCount - paidCount;

  return (
    <div className="sticky bottom-4 z-20 mx-auto max-w-lg rounded-2xl border border-border bg-white p-3 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            Round {currentRound.roundNumber} &middot; {paidCount} of {totalCount} paid
          </p>
          {pendingCount > 0 ? (
            <p className="text-xs text-muted-foreground">
              {pendingCount} member{pendingCount === 1 ? "" : "s"} pending
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          {role === "creator" && pendingCount > 0 && onSendReminders ? (
            <Button size="sm" variant="outline" onClick={onSendReminders}>
              <Bell className="mr-1.5 size-3.5" />
              Remind all
            </Button>
          ) : null}
          {role === "member" && onPayNow ? (
            <Button size="sm" onClick={onPayNow}>
              <Send className="mr-1.5 size-3.5" />
              Pay now
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
