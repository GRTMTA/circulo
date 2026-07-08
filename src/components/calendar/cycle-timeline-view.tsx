"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { DashboardContribution, DashboardMember, DashboardPayout, DashboardRound } from "@/lib/dashboard/types";

function memberName(members: DashboardMember[], id: string | null) {
  return members.find((m) => m.id === id)?.displayName ?? "Unassigned";
}

function memberAvatar(members: DashboardMember[], id: string | null) {
  return members.find((m) => m.id === id) ?? null;
}

export function CycleTimelineView({
  rounds,
  payouts,
  contributions,
  members,
  currentMemberId,
}: {
  rounds: DashboardRound[];
  payouts: DashboardPayout[];
  contributions: DashboardContribution[];
  members: DashboardMember[];
  currentMemberId?: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sorted = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  const payoutMap = new Map(payouts.map((p) => [p.roundNumber, p]));

  return (
    <div className="relative">
      <div className="absolute bottom-0 left-5 top-0 w-0.5 bg-border" />

      <div className="space-y-0">
        {sorted.map((round) => {
          const payout = payoutMap.get(round.roundNumber);
          const recipient = memberAvatar(members, payout?.recipientMemberId ?? null);
          const roundContributions = contributions.filter((c) =>
            members.find((m) => m.id === c.memberId && m.payoutRound === round.roundNumber)
          );

          const isCurrentRound = ["active", "late", "grace_period"].includes(round.status);
          const isCompleted = round.status === "completed";
          const isActive = isCurrentRound;
          const isMyPayout = currentMemberId && payout?.recipientMemberId === currentMemberId;
          const isExpanded = expanded.has(round.id);

          const nodeColor =
            isCompleted ? "bg-green-500" :
            isActive && round.status === "late" ? "bg-red-500" :
            isActive ? "bg-blue-500 ring-4 ring-blue-200" :
            "bg-gray-300";

          return (
            <div key={round.id} className="relative pb-6 last:pb-0">
              <div className="flex gap-4">
                <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-4 border-[var(--color-background-section)] bg-white">
                  <span className={cn("size-4 rounded-full", nodeColor)} />
                </div>

                <div className={cn(
                  "min-w-0 flex-1 rounded-xl border border-border bg-white p-4",
                  isActive && "ring-2 ring-[var(--color-primary-muted)]",
                )}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {recipient ? (
                        <Avatar className="size-10">
                          <AvatarImage src={recipient.avatarUrl ?? undefined} alt={recipient.displayName} />
                          <AvatarFallback>
                            {recipient.displayName
                              .split(/\s+/)
                              .map((p) => p[0]?.toUpperCase() ?? "")
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      ) : null}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">Round {round.roundNumber}</p>
                          {isMyPayout ? (
                            <Star className="size-4 text-amber-500" />
                          ) : null}
                          {isCurrentRound ? (
                            <Badge variant="default">Active</Badge>
                          ) : isCompleted ? (
                            <Badge variant="outline">Completed</Badge>
                          ) : (
                            <Badge variant="secondary">Scheduled</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Payout to {memberName(members, payout?.recipientMemberId ?? null)}
                          {isMyPayout ? " (you)" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {round.collectedAmount} / {round.expectedAmount} USDC
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {round.dueAt
                          ? new Date(round.dueAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                          })
                          : "Not scheduled"}
                      </p>
                    </div>
                  </div>

                  <Progress
                    value={round.expectedAmount > 0 ? Math.round((round.collectedAmount / round.expectedAmount) * 100) : 0}
                    className="mt-3"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => toggle(round.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="mr-1 size-4" />
                    ) : (
                      <ChevronRight className="mr-1 size-4" />
                    )}
                    {isExpanded ? "Hide" : "Show"} contributions
                  </Button>

                  {isExpanded ? (
                    <div className="mt-3 space-y-2 border-t border-border pt-3">
                      {members.map((member) => {
                        const contrib = roundContributions.find((c) => c.memberId === member.id);
                        const paid = contrib?.status === "paid";
                        return (
                          <div key={member.id} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="size-6">
                                <AvatarImage src={member.avatarUrl ?? undefined} alt={member.displayName} />
                                <AvatarFallback>{member.displayName[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{member.displayName}</span>
                            </div>
                            <span className={cn(
                              "text-sm font-medium",
                              paid ? "text-green-600" : "text-muted-foreground",
                            )}>
                              {paid ? "Paid" : "Pending"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
