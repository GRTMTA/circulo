"use client";

import { ArrowDown, ArrowUp, Info, Users, Vote } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CreatePayoutOrderItem, PayoutOrderMode } from "@/lib/create/types";
import { cn } from "@/lib/utils";

const MODE_OPTIONS: {
  value: PayoutOrderMode;
  label: string;
  description: string;
  icon: typeof Users;
}[] = [
  {
    value: "creator",
    label: "Creator sets the order",
    description: "You arrange the payout order now. It locks at activation.",
    icon: Users,
  },
  {
    value: "voting",
    label: "Members vote",
    description: "Members vote on the order before activation. The creator seeds a proposed order.",
    icon: Vote,
  },
];

export function CreatePayoutOrderStep({
  order,
  onReorder,
  mode,
  onModeChange,
}: {
  order: CreatePayoutOrderItem[];
  onReorder: (order: CreatePayoutOrderItem[]) => void;
  mode: PayoutOrderMode;
  onModeChange: (mode: PayoutOrderMode) => void;
}) {
  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    const next = [...order];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onReorder(next.map((member, memberIndex) => ({ ...member, payoutRound: memberIndex + 1 })));
  }

  return (
    <div className="grid gap-4">
      {/* Mode selection */}
      <div className="grid gap-3 sm:grid-cols-2">
        {MODE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = mode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onModeChange(option.value)}
              aria-pressed={active}
              className={cn(
                "grid gap-1.5 rounded-xl border p-4 text-left transition-colors",
                active
                  ? "border-primary bg-[var(--color-primary-muted)]/40 ring-2 ring-primary/20"
                  : "border-border bg-white hover:border-primary/40"
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-primary" />
                <span className="font-semibold">{option.label}</span>
              </div>
              <span className="text-sm text-muted-foreground">{option.description}</span>
            </button>
          );
        })}
      </div>

      <Alert>
        <Info className="size-4" />
        <AlertTitle>How payout order works</AlertTitle>
        <AlertDescription>
          {mode === "voting"
            ? "Each round, one member receives the full pool. You seed a proposed order below; members vote to confirm it before the cycle starts. The order locks at activation."
            : "Each round, one member receives the full pool. Earlier positions get paid sooner but still contribute for remaining rounds. Set the order everyone agrees on — this locks at activation."}
        </AlertDescription>
      </Alert>

      {order.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Add members in the Roster step first.
        </p>
      ) : null}

      {order.map((member, index) => (
        <div
          key={member.walletAddress}
          className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
        >
          <Badge>Round {index + 1}</Badge>
          <div className="min-w-0">
            <p className="font-semibold">{member.displayName}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {member.walletAddress}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={index === 0}
              onClick={() => move(index, -1)}
              aria-label={`Move ${member.displayName} up`}
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={index === order.length - 1}
              onClick={() => move(index, 1)}
              aria-label={`Move ${member.displayName} down`}
            >
              <ArrowDown className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
