"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CreatePayoutOrderItem } from "@/lib/mocks";

export function CreatePayoutOrderStep({
  order,
  onReorder,
}: {
  order: CreatePayoutOrderItem[];
  onReorder: (order: CreatePayoutOrderItem[]) => void;
}) {
  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    const next = [...order];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onReorder(next.map((member, memberIndex) => ({ ...member, payoutRound: memberIndex + 1 })));
  }

  return (
    <div className="grid gap-3">
      <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground">
        Once the pool becomes active, payout order cannot be changed.
      </div>
      {order.map((member, index) => (
        <div key={member.walletAddress} className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <Badge>Round {index + 1}</Badge>
          <div className="min-w-0">
            <p className="font-semibold">{member.displayName}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">{member.walletAddress}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="icon-sm" onClick={() => move(index, -1)} aria-label={`Move ${member.displayName} up`}>
              <ArrowUp className="size-4" />
            </Button>
            <Button type="button" variant="outline" size="icon-sm" onClick={() => move(index, 1)} aria-label={`Move ${member.displayName} down`}>
              <ArrowDown className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

