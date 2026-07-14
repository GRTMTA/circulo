"use client";

import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Ban,
  Bell,
  CalendarCheck,
  CheckCircle2,
  CircleDot,
  CirclePause,
  CirclePlay,
  CircleX,
  Clock,
  CreditCard,
  Flag,
  Link2,
  LockKeyhole,
  type LucideIcon,
  RefreshCcw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Slash,
  UserCheck,
  UserMinus,
  UserPlus,
  UsersRound,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardAuditEvent, DashboardMember } from "@/lib/dashboard/types";

// ─── Event metadata ──────────────────────────────────────────────────────────

interface EventMeta {
  icon: LucideIcon;
  label: string;
  description: (memberName: string | null, roundNumber: number | null, txHash: string | null) => string;
  color: string;
  category: "circle" | "member" | "payment" | "collateral" | "dispute";
}

const EVENT_META: Record<string, EventMeta> = {
  pool_created: {
    icon: CircleDot,
    label: "Circle created",
    description: (m) => m ? `${m} created the circle` : "Circle was created",
    color: "text-[var(--color-primary-default)]",
    category: "circle",
  },
  circle_activated: {
    icon: CirclePlay,
    label: "Circle activated",
    description: () => "Circle is now active — contributions begin",
    color: "text-[var(--color-success-default)]",
    category: "circle",
  },
  circle_completed: {
    icon: CheckCircle2,
    label: "Circle completed",
    description: () => "All rounds completed successfully",
    color: "text-[var(--color-success-default)]",
    category: "circle",
  },
  circle_paused: {
    icon: CirclePause,
    label: "Circle paused",
    description: () => "Circle paused — all activity frozen",
    color: "text-[var(--color-warning-default)]",
    category: "circle",
  },
  circle_resumed: {
    icon: CirclePlay,
    label: "Circle resumed",
    description: () => "Circle resumed — activity continues",
    color: "text-[var(--color-success-default)]",
    category: "circle",
  },
  circle_cancelled: {
    icon: CircleX,
    label: "Circle cancelled",
    description: () => "Circle permanently cancelled",
    color: "text-[var(--color-error-default)]",
    category: "circle",
  },
  member_invited: {
    icon: UserPlus,
    label: "Member invited",
    description: (m) => m ? `${m} was invited to join` : "A member was invited",
    color: "text-[var(--color-primary-default)]",
    category: "member",
  },
  agreement_accepted: {
    icon: UserCheck,
    label: "Agreement accepted",
    description: (m) => m ? `${m} accepted the circle rules` : "Agreement accepted",
    color: "text-[var(--color-success-default)]",
    category: "member",
  },
  member_left: {
    icon: UserMinus,
    label: "Member left",
    description: (m) => m ? `${m} left the circle` : "A member left",
    color: "text-muted-foreground",
    category: "member",
  },
  member_restricted: {
    icon: Ban,
    label: "Member restricted",
    description: (m) => m ? `${m} was restricted from future circles` : "A member was restricted",
    color: "text-[var(--color-error-default)]",
    category: "member",
  },
  collateral_posted: {
    icon: LockKeyhole,
    label: "Collateral posted",
    description: (m) => m ? `${m} posted collateral` : "Collateral was posted",
    color: "text-[var(--color-success-default)]",
    category: "collateral",
  },
  collateral_slashed: {
    icon: Slash,
    label: "Collateral slashed",
    description: (m) => m ? `${m}'s collateral was slashed` : "Collateral was slashed",
    color: "text-[var(--color-error-default)]",
    category: "collateral",
  },
  collateral_refunded: {
    icon: RefreshCcw,
    label: "Collateral refunded",
    description: (m) => m ? `${m}'s collateral was returned` : "Collateral was refunded",
    color: "text-[var(--color-success-default)]",
    category: "collateral",
  },
  contribution_paid: {
    icon: CreditCard,
    label: "Contribution paid",
    description: (m, r) => m ? `${m} paid contribution${r ? ` for round ${r}` : ""}` : `Contribution paid${r ? ` for round ${r}` : ""}`,
    color: "text-[var(--color-success-default)]",
    category: "payment",
  },
  contribution_verified: {
    icon: CheckCircle2,
    label: "Payment verified",
    description: (m, r) => m ? `${m}'s payment verified on-chain${r ? ` (round ${r})` : ""}` : "Payment verified on-chain",
    color: "text-[var(--color-success-default)]",
    category: "payment",
  },
  payout_initiated: {
    icon: ArrowUpFromLine,
    label: "Payout initiated",
    description: (m, r) => m ? `Payout initiated to ${m}${r ? ` for round ${r}` : ""}` : "Payout was initiated",
    color: "text-[var(--color-primary-default)]",
    category: "payment",
  },
  payout_released: {
    icon: ArrowDownToLine,
    label: "Payout released",
    description: (m, r) => m ? `${m} received payout${r ? ` for round ${r}` : ""}` : "Payout was released",
    color: "text-[var(--color-success-default)]",
    category: "payment",
  },
  reminder_sent: {
    icon: Bell,
    label: "Reminder sent",
    description: (m) => m ? `Reminder sent to ${m}` : "Contribution reminder sent",
    color: "text-muted-foreground",
    category: "payment",
  },
  grace_period_started: {
    icon: Clock,
    label: "Grace period started",
    description: (m) => m ? `Grace period started for ${m}` : "Grace period started",
    color: "text-[var(--color-warning-default)]",
    category: "payment",
  },
  grace_period_ended: {
    icon: ShieldAlert,
    label: "Grace period ended",
    description: (m) => m ? `Grace period expired for ${m}` : "Grace period expired",
    color: "text-[var(--color-error-default)]",
    category: "payment",
  },
  dispute_raised: {
    icon: Flag,
    label: "Dispute raised",
    description: (m) => m ? `${m} raised a dispute` : "A dispute was raised",
    color: "text-[var(--color-error-default)]",
    category: "dispute",
  },
  dispute_resolved: {
    icon: ShieldCheck,
    label: "Dispute resolved",
    description: () => "Dispute was resolved",
    color: "text-[var(--color-success-default)]",
    category: "dispute",
  },
  round_started: {
    icon: CalendarCheck,
    label: "Round started",
    description: (_, r) => r ? `Round ${r} has started` : "New round started",
    color: "text-[var(--color-primary-default)]",
    category: "circle",
  },
  round_completed: {
    icon: CheckCircle2,
    label: "Round completed",
    description: (_, r) => r ? `Round ${r} completed` : "Round completed",
    color: "text-[var(--color-success-default)]",
    category: "circle",
  },
  settings_changed: {
    icon: Settings,
    label: "Settings changed",
    description: () => "Circle settings were updated",
    color: "text-muted-foreground",
    category: "circle",
  },
  payout_order_changed: {
    icon: UsersRound,
    label: "Payout order changed",
    description: () => "Payout order was updated",
    color: "text-muted-foreground",
    category: "circle",
  },
};

const DEFAULT_META: EventMeta = {
  icon: CircleDot,
  label: "Event",
  description: (_, __, ___) => "Activity recorded",
  color: "text-muted-foreground",
  category: "circle",
};

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  circle: "Circle",
  member: "Members",
  payment: "Payments",
  collateral: "Collateral",
  dispute: "Disputes",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMemberName(members: DashboardMember[], memberId: string | null): string | null {
  if (!memberId) return null;
  const member = members.find((m) => m.id === memberId);
  return member?.displayName ?? null;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function shortenHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AuditLog({
  events,
  members,
  maxVisible = 50,
}: {
  events: DashboardAuditEvent[];
  members: DashboardMember[];
  maxVisible?: number;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [showAll, setShowAll] = useState(false);

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center">
        <CircleDot className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">No activity yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Events will appear here as the circle progresses — invites, payments,
          payouts, and more.
        </p>
      </div>
    );
  }

  const filteredEvents =
    filter === "all"
      ? events
      : events.filter((e) => {
          const meta = EVENT_META[e.eventType] ?? DEFAULT_META;
          return meta.category === filter;
        });

  const visibleEvents = showAll ? filteredEvents : filteredEvents.slice(0, maxVisible);
  const hasMore = filteredEvents.length > maxVisible && !showAll;

  return (
    <div className="grid gap-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
          const count =
            key === "all"
              ? events.length
              : events.filter((e) => (EVENT_META[e.eventType] ?? DEFAULT_META).category === key).length;

          if (key !== "all" && count === 0) return null;

          return (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              size="xs"
              onClick={() => setFilter(key)}
            >
              {label}
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[0.6rem]">
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="grid gap-0">
        {visibleEvents.map((event, index) => {
          const meta = EVENT_META[event.eventType] ?? DEFAULT_META;
          const memberName = getMemberName(members, event.memberId);
          const Icon = meta.icon;
          const isLast = index === visibleEvents.length - 1;

          return (
            <div key={event.id} className="flex gap-3">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-white ${meta.color}`}>
                  <Icon className="size-3.5" />
                </div>
                {!isLast ? <div className="mt-1 flex-1 w-px bg-border" /> : null}
              </div>

              {/* Event content */}
              <div className="flex-1 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--color-text-default)]">
                      {meta.description(memberName, event.roundNumber, event.txHash)}
                    </p>
                    {event.txHash ? (
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        tx: {shortenHash(event.txHash)}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatTimestamp(event.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more */}
      {hasMore ? (
        <Button variant="outline" onClick={() => setShowAll(true)}>
          Show all {filteredEvents.length} events
        </Button>
      ) : null}
    </div>
  );
}
