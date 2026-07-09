"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

export function NextPayoutBanner({
  recipientName,
  recipientAvatarUrl,
  amount,
  asset,
  expectedAt,
  status,
  isCurrentUserRecipient,
}: {
  recipientName: string;
  recipientAvatarUrl?: string | null;
  amount: number;
  asset: string;
  expectedAt: string;
  status: "scheduled" | "ready" | "paid" | "delayed" | "disputed";
  isCurrentUserRecipient?: boolean;
}) {
  const countdown = useCountdown(expectedAt);

  const isDelayed = status === "delayed";
  const isDisputed = status === "disputed";
  const isPaid = status === "paid";
  const isReady = status === "ready";
  const isYou = isCurrentUserRecipient;

  const variant = isDisputed ? "destructive" : isDelayed ? "destructive" : "default";

  return (
    <Alert
      variant={variant}
      className={cn(
        isYou && !isDisputed && !isDelayed && "border-green-300 bg-green-50",
        isDelayed && "border-amber-300 bg-amber-50",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {recipientAvatarUrl ? (
            <Avatar className="size-10 shrink-0">
              <AvatarImage src={recipientAvatarUrl} alt={recipientName} />
              <AvatarFallback>
                {recipientName
                  .split(/\s+/)
                  .map((p) => p[0]?.toUpperCase() ?? "")
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="font-bold text-primary">{recipientName[0]}</span>
            </div>
          )}
          <div className="min-w-0">
            <AlertTitle>
              {isYou ? "You're getting paid!" : `Next payout: ${recipientName}`}
            </AlertTitle>
            <AlertDescription>
              {isPaid ? (
                <span>
                  {amount} {asset} paid on{" "}
                  {new Date(expectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric" })}
                </span>
              ) : isReady ? (
                <span className="font-semibold text-green-700">
                  {amount} {asset} ready — payout can be released
                </span>
              ) : isDelayed ? (
                <span>
                  {amount} {asset} delayed — was expected{" "}
                  {new Date(expectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              ) : isDisputed ? (
                <span className="font-semibold text-red-700">
                  {amount} {asset} disputed — under review
                </span>
              ) : countdown ? (
                <span>
                  {amount} {asset} in{" "}
                  <span className="font-mono font-semibold tabular-nums">
                    {String(countdown.hours).padStart(2, "0")}:
                    {String(countdown.minutes).padStart(2, "0")}:
                    {String(countdown.seconds).padStart(2, "0")}
                  </span>
                </span>
              ) : (
                <span>
                  {amount} {asset} expected{" "}
                  {new Date(expectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric" })}
                </span>
              )}
            </AlertDescription>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={
              isPaid ? "default" :
              isDisputed ? "destructive" :
              isDelayed ? "destructive" :
              isReady ? "default" :
              "secondary"
            }
          >
            {status}
          </Badge>
        </div>
      </div>
    </Alert>
  );
}
