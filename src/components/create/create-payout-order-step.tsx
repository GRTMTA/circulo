"use client";

import { ArrowDown, ArrowUp, Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    <div className="grid gap-4">
      <Alert>
        <Info className="size-4" />
        <AlertTitle>How payout order works</AlertTitle>
        <AlertDescription>
          Each round, one member receives the full pool. Earlier positions get
          paid sooner but still contribute for remaining rounds. Drag members to
          set the order everyone agrees on — this locks at activation.
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
