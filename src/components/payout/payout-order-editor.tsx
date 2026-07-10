"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DashboardMember } from "@/lib/dashboard/types";

export function PayoutOrderEditor({
  members,
  locked,
}: {
  members: DashboardMember[];
  order?: string[];
  locked: boolean;
}) {
  const [orderedMembers, setOrderedMembers] = useState(members);

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (locked || nextIndex < 0 || nextIndex >= orderedMembers.length) return;
    const next = [...orderedMembers];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setOrderedMembers(next);
  }

  return (
    <div className="grid gap-3">
      <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground">
        <LockKeyhole className="mr-2 inline size-4 text-primary" />
        Payout order is locked once the circle is activated.
      </div>
      {orderedMembers.map((member, index) => (
        <div key={member.id} className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <Badge>Round {index + 1}</Badge>
          <div><p className="font-semibold">{member.displayName}</p><p className="font-mono text-xs text-muted-foreground">{member.walletAddress.slice(0, 12)}...</p></div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="icon-sm" disabled={locked} onClick={() => move(index, -1)}><ArrowUp className="size-4" /></Button>
            <Button type="button" variant="outline" size="icon-sm" disabled={locked} onClick={() => move(index, 1)}><ArrowDown className="size-4" /></Button>
          </div>
        </div>
      ))}
      <Button disabled={locked} onClick={() => toast.success("Payout order saved")}>Save Order</Button>
    </div>
  );
}

