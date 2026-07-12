"use client";

import { AlertTriangle, Bell, Clock } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardContribution, DashboardRound } from "@/lib/dashboard/types";

function getHoursUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  const now = new Date();
  return (due.getTime() - now.getTime()) / (1000 * 60 * 60);
}

function formatTimeRemaining(hours: number): string {
  if (hours <= 0) return "Overdue";
  if (hours < 1) return `${Math.ceil(hours * 60)} minutes`;
  if (hours < 24) return `${Math.ceil(hours)} hours`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.ceil(hours % 24);
  return `${days} day${days > 1 ? "s" : ""}${remainingHours > 0 ? `, ${remainingHours}h` : ""}`;
}

type Urgency = "info" | "warning" | "critical";

function getUrgency(hours: number | null): Urgency {
  if (hours === null) return "info";
  if (hours <= 0) return "critical";
  if (hours <= 4) return "critical";
  if (hours <= 24) return "warning";
  return "info";
}

export function ContributionReminderBanner({
  currentRound,
  myContribution,
  contributionAmount,
  contributionAsset,
  onPayClick,
}: {
  currentRound: DashboardRound | null;
  myContribution: DashboardContribution | null | undefined;
  contributionAmount: number;
  contributionAsset: string;
  onPayClick?: () => void;
}) {
  // Don't show if no round or already paid
  if (!currentRound) return null;
  if (myContribution?.status === "paid" || myContribution?.status === "verifying") return null;
  if (myContribution?.status === "not_due") return null;

  const hoursLeft = getHoursUntil(currentRound.dueAt);
  const urgency = getUrgency(hoursLeft);

  // Don't show banner if more than 48h away
  if (hoursLeft !== null && hoursLeft > 48) return null;

  const isOverdue = hoursLeft !== null && hoursLeft <= 0;
  const isGracePeriod = myContribution?.status === "grace_period";

  const Icon = isOverdue || isGracePeriod ? AlertTriangle : hoursLeft !== null && hoursLeft <= 4 ? Bell : Clock;

  const borderColor =
    urgency === "critical"
      ? "border-[var(--color-error-default)]/30"
      : urgency === "warning"
        ? "border-[var(--color-warning-default)]/30"
        : "border-[var(--color-primary-default)]/30";

  const bgColor =
    urgency === "critical"
      ? "bg-[var(--color-error-default)]/5"
      : urgency === "warning"
        ? "bg-[var(--color-warning-default)]/5"
        : "bg-[var(--color-primary-muted)]/30";

  return (
    <div className={`rounded-2xl border ${borderColor} ${bgColor} p-4`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon className={`mt-0.5 size-5 shrink-0 ${
            urgency === "critical"
              ? "text-[var(--color-error-default)]"
              : urgency === "warning"
                ? "text-[var(--color-warning-default)]"
                : "text-[var(--color-primary-default)]"
          }`} />
          <div>
            <p className="font-semibold text-sm">
              {isGracePeriod
                ? "Grace period active — collateral at risk"
                : isOverdue
                  ? "Contribution overdue"
                  : `Contribution due in ${formatTimeRemaining(hoursLeft!)}`}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {contributionAmount} {contributionAsset} for Round {currentRound.roundNumber}.
              {isGracePeriod
                ? " Pay now to prevent collateral slashing."
                : isOverdue
                  ? " Grace period may be active. Pay immediately."
                  : " Pay on time to keep your collateral safe."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hoursLeft !== null ? (
            <Badge
              variant={urgency === "critical" ? "destructive" : urgency === "warning" ? "secondary" : "outline"}
            >
              {isOverdue ? "Overdue" : formatTimeRemaining(hoursLeft)}
            </Badge>
          ) : null}
          {onPayClick ? (
            <Button size="sm" onClick={onPayClick}>
              Pay Now
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
