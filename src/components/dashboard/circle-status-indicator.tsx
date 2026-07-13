"use client";

import {
  CheckCircle2,
  CircleDot,
  CirclePause,
  CirclePlay,
  CircleX,
  Clock,
  Flag,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CircleStatus } from "@/lib/dashboard/types";

// ─── Status metadata ─────────────────────────────────────────────────────────

interface StatusMeta {
  icon: LucideIcon;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeVariant: "default" | "secondary" | "outline" | "destructive";
}

const STATUS_MAP: Record<CircleStatus, StatusMeta> = {
  draft: {
    icon: CircleDot,
    label: "Draft",
    description:
      "Circle is being set up. Members, rules, and settings can still be changed. Activation requires all gates to pass.",
    color: "text-[var(--color-text-alternative)]",
    bgColor: "bg-[var(--color-background-muted)]",
    borderColor: "border-[var(--color-border-default)]",
    badgeVariant: "secondary",
  },
  active: {
    icon: CirclePlay,
    label: "Active",
    description:
      "Circle is live. Contributions are being collected each round and payouts are distributed according to the locked order.",
    color: "text-[var(--color-success-default)]",
    bgColor: "bg-[var(--color-success-default)]/5",
    borderColor: "border-[var(--color-success-default)]/20",
    badgeVariant: "default",
  },
  paused: {
    icon: CirclePause,
    label: "Paused",
    description:
      "Circle is temporarily frozen. No contributions are collected and no payouts are made. The creator can resume or cancel.",
    color: "text-[var(--color-warning-default)]",
    bgColor: "bg-[var(--color-warning-default)]/5",
    borderColor: "border-[var(--color-warning-default)]/20",
    badgeVariant: "secondary",
  },
  delayed: {
    icon: Clock,
    label: "Delayed",
    description:
      "One or more contributions are overdue. The circle remains active but the current round's payout may be delayed until funds are collected.",
    color: "text-[var(--color-warning-default)]",
    bgColor: "bg-[var(--color-warning-default)]/5",
    borderColor: "border-[var(--color-warning-default)]/20",
    badgeVariant: "secondary",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    description:
      "All rounds finished successfully. Every member received their payout. Collateral has been returned.",
    color: "text-[var(--color-success-default)]",
    bgColor: "bg-[var(--color-success-default)]/5",
    borderColor: "border-[var(--color-success-default)]/20",
    badgeVariant: "default",
  },
  disputed: {
    icon: Flag,
    label: "Disputed",
    description:
      "A member raised a dispute. The circle is paused while the issue is under review. Resolution may result in resumption or cancellation.",
    color: "text-[var(--color-error-default)]",
    bgColor: "bg-[var(--color-error-default)]/5",
    borderColor: "border-[var(--color-error-default)]/20",
    badgeVariant: "destructive",
  },
  cancelled: {
    icon: CircleX,
    label: "Cancelled",
    description:
      "Circle was permanently terminated. All unslashed collateral has been returned. This circle cannot be restarted.",
    color: "text-[var(--color-error-default)]",
    bgColor: "bg-[var(--color-error-default)]/5",
    borderColor: "border-[var(--color-error-default)]/20",
    badgeVariant: "destructive",
  },
};

// ─── Compact badge (for use in headers, cards, lists) ────────────────────────

export function CircleStatusBadge({ status }: { status: CircleStatus }) {
  const meta = STATUS_MAP[status];
  const Icon = meta.icon;

  return (
    <Badge variant={meta.badgeVariant} className="gap-1.5">
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  );
}

// ─── Inline indicator (icon + label, no background) ──────────────────────────

export function CircleStatusInline({ status }: { status: CircleStatus }) {
  const meta = STATUS_MAP[status];
  const Icon = meta.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${meta.color}`}>
      <Icon className="size-4" />
      {meta.label}
    </span>
  );
}

// ─── Full banner (prominent, with description — for dashboard tops) ──────────

export function CircleStatusBanner({
  status,
  className,
}: {
  status: CircleStatus;
  className?: string;
}) {
  const meta = STATUS_MAP[status];
  const Icon = meta.icon;

  // Only show banner for non-default states (not active/draft)
  if (status === "active" || status === "draft") return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 ${meta.borderColor} ${meta.bgColor} ${className ?? ""}`}
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${meta.color}`} />
      <div>
        <p className={`text-sm font-bold ${meta.color}`}>{meta.label}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
          {meta.description}
        </p>
      </div>
    </div>
  );
}

// ─── Status card (overview widget with icon, label, description) ─────────────

export function CircleStatusCard({
  status,
  currentRound,
  totalRounds,
}: {
  status: CircleStatus;
  currentRound?: number;
  totalRounds?: number;
}) {
  const meta = STATUS_MAP[status];
  const Icon = meta.icon;

  return (
    <div className={`rounded-2xl border p-5 ${meta.borderColor} ${meta.bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex size-10 items-center justify-center rounded-xl border ${meta.borderColor} bg-white`}>
            <Icon className={`size-5 ${meta.color}`} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Circle Status
            </p>
            <p className={`text-lg font-bold ${meta.color}`}>{meta.label}</p>
          </div>
        </div>
        {currentRound && totalRounds ? (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-sm font-bold">
              Round {currentRound} / {totalRounds}
            </p>
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {meta.description}
      </p>
    </div>
  );
}

// ─── Status transition timeline (shows lifecycle) ────────────────────────────

const LIFECYCLE_ORDER: CircleStatus[] = [
  "draft",
  "active",
  "completed",
];

export function CircleStatusTimeline({ currentStatus }: { currentStatus: CircleStatus }) {
  // For non-standard paths (paused, disputed, cancelled), show them as branches
  const isNonStandard = ["paused", "delayed", "disputed", "cancelled"].includes(currentStatus);
  const activeIndex = LIFECYCLE_ORDER.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {LIFECYCLE_ORDER.map((step, index) => {
        const meta = STATUS_MAP[step];
        const Icon = meta.icon;
        const isPast = activeIndex >= 0 ? index < activeIndex : step === "draft";
        const isCurrent = step === currentStatus;

        return (
          <div key={step} className="flex items-center">
            <div
              className={`flex size-8 items-center justify-center rounded-full border transition-colors ${
                isCurrent
                  ? `${meta.borderColor} ${meta.bgColor}`
                  : isPast
                    ? "border-[var(--color-success-default)]/30 bg-[var(--color-success-default)]/10"
                    : "border-border bg-white"
              }`}
            >
              <Icon
                className={`size-3.5 ${
                  isCurrent ? meta.color : isPast ? "text-[var(--color-success-default)]" : "text-muted-foreground"
                }`}
              />
            </div>
            {index < LIFECYCLE_ORDER.length - 1 ? (
              <div
                className={`h-px w-6 ${
                  isPast ? "bg-[var(--color-success-default)]/40" : "bg-border"
                }`}
              />
            ) : null}
          </div>
        );
      })}
      {isNonStandard ? (
        <>
          <div className="h-px w-4 bg-border" />
          <div
            className={`flex size-8 items-center justify-center rounded-full border ${STATUS_MAP[currentStatus].borderColor} ${STATUS_MAP[currentStatus].bgColor}`}
          >
            {(() => {
              const Icon = STATUS_MAP[currentStatus].icon;
              return <Icon className={`size-3.5 ${STATUS_MAP[currentStatus].color}`} />;
            })()}
          </div>
          <span className={`ml-1.5 text-xs font-semibold ${STATUS_MAP[currentStatus].color}`}>
            {STATUS_MAP[currentStatus].label}
          </span>
        </>
      ) : null}
    </div>
  );
}
