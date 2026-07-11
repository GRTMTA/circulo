"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useCountdown(targetDate: string) {
  const [remaining, setRemaining] = useState<{ hours: number; minutes: number; seconds: number; total: number } | null>(null);

  useEffect(() => {
    function tick() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        return null;
      }
      const total = Math.floor(diff / 1000);
      const hours = Math.floor(total / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      const seconds = total % 60;
      setRemaining({ hours, minutes, seconds, total });
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return remaining;
}

export function NextContributionBanner({
  amount,
  asset,
  dueAt,
  urgency,
  memberName,
  memberAvatarUrl,
  onPayNow,
}: {
  amount: number;
  asset: string;
  dueAt: string;
  urgency: "normal" | "soon" | "overdue";
  memberName?: string;
  memberAvatarUrl?: string | null;
  onPayNow?: () => void;
}) {
  const countdown = useCountdown(dueAt);
  const isOverdue = urgency === "overdue" || (countdown !== null && countdown.total <= 0);
  const isSoon = urgency === "soon" || (countdown !== null && countdown.total > 0 && countdown.total < 7200);

  const variant = isOverdue ? "destructive" : "default";

  return (
    <Alert
      variant={variant}
      className={cn(
        isOverdue && "animate-pulse border-red-300 bg-red-50",
        isSoon && !isOverdue && "border-amber-300 bg-amber-50",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {memberAvatarUrl ? (
            <Avatar className="size-10 shrink-0">
              <AvatarImage src={memberAvatarUrl} alt={memberName ?? ""} />
              <AvatarFallback>{(memberName ?? "?")[0]}</AvatarFallback>
            </Avatar>
          ) : null}
          <div className="min-w-0">
            <AlertTitle>
              {isOverdue ? "Contribution overdue!" : "Next contribution"}
              {memberName ? ` — ${memberName}` : ""}
            </AlertTitle>
            <AlertDescription>
              {isOverdue ? (
                <span>
                  {amount} {asset} was due {new Date(dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric" })}
                  {countdown && countdown.total < 0
                    ? ` — ${Math.abs(Math.floor(-countdown.total / 3600))}h ${Math.abs(Math.floor((-countdown.total % 3600) / 60))}m overdue`
                    : ""}
                </span>
              ) : countdown ? (
                <span>
                  {amount} {asset} due in{" "}
                  <span className="font-mono font-semibold tabular-nums">
                    {String(countdown.hours).padStart(2, "0")}:
                    {String(countdown.minutes).padStart(2, "0")}:
                    {String(countdown.seconds).padStart(2, "0")}
                  </span>
                </span>
              ) : (
                <span>
                  {amount} {asset} due {new Date(dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric" })}
                </span>
              )}
            </AlertDescription>
          </div>
        </div>
        {onPayNow ? (
          <Button
            className={cn(
              "shrink-0",
              isOverdue && "bg-red-600 hover:bg-red-700 animate-pulse",
            )}
            onClick={onPayNow}
          >
            Pay {amount} {asset}
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}
