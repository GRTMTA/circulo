"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CirclePause,
  CircleX,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Vote,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CircleStatus } from "@/lib/dashboard/types";
import { toast } from "sonner";

// ─── Rule definitions ────────────────────────────────────────────────────────

export const PAUSE_RULES = [
  {
    id: "fraud",
    icon: ShieldAlert,
    title: "Suspected fraud",
    description:
      "If a member reports suspected fraud or unauthorized transactions, the creator can pause the circle to investigate.",
  },
  {
    id: "payment-failure",
    icon: AlertTriangle,
    title: "Major payment failure",
    description:
      "If 2 or more members miss contributions in the same round, the circle auto-pauses until the creator reviews.",
  },
  {
    id: "dispute",
    icon: Vote,
    title: "Active dispute",
    description:
      "Any member can raise a dispute. The circle pauses automatically while the dispute is being resolved.",
  },
  {
    id: "external",
    icon: Clock,
    title: "External emergency",
    description:
      "Natural disaster, regulatory action, or platform outage. Creator can pause with a stated reason visible to all members.",
  },
];

export const CANCEL_RULES = [
  {
    id: "creator-cancel",
    title: "Creator-initiated cancellation",
    description:
      "The creator can cancel the circle only while it is draft or pending. Once active, dissolution requires unanimous member approval.",
  },
  {
    id: "majority-vote",
    title: "Majority vote cancellation",
    description:
      "Every member must vote YES before an active circle is dissolved. A single NO restores the active state.",
  },
  {
    id: "unresolved-dispute",
    title: "Unresolved dispute timeout",
    description:
      "A paused dashboard state does not bypass the on-chain dissolution vote. The contract remains the source of truth.",
  },
  {
    id: "collateral-return",
    title: "Collateral handling on cancellation",
    description:
      "All unslashed collateral is returned to members. Any contributions already collected in the current round are returned pro-rata.",
  },
];

// ─── Rules display (read-only, visible to both creator and member) ───────────

export function EmergencyRulesDisplay() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CirclePause className="size-5 text-[var(--color-warning-default)]" />
            <CardTitle>Pause Rules</CardTitle>
          </div>
          <CardDescription>
            A paused dashboard state freezes the UI. Active on-chain circles still require unanimous dissolution approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {PAUSE_RULES.map((rule) => (
            <div
              key={rule.id}
              className="flex gap-3 rounded-xl border border-border bg-white p-4"
            >
              <rule.icon className="mt-0.5 size-4 shrink-0 text-[var(--color-warning-default)]" />
              <div>
                <p className="text-sm font-semibold">{rule.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {rule.description}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CircleX className="size-5 text-[var(--color-error-default)]" />
            <CardTitle>Cancellation Rules</CardTitle>
          </div>
          <CardDescription>
            Cancellation permanently ends the circle. It cannot be restarted — a new circle must be created.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {CANCEL_RULES.map((rule) => (
            <div
              key={rule.id}
              className="rounded-xl border border-border bg-white p-4"
            >
              <p className="text-sm font-semibold">{rule.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {rule.description}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Creator actions panel (pause/resume/cancel controls) ────────────────────

export function EmergencyActionsPanel({
  circleId,
  circleStatus,
  onPause,
  onResume,
  onCancel,
}: {
  circleId: string;
  circleStatus: CircleStatus;
  onPause: (reason: string) => Promise<void>;
  onResume: () => Promise<void>;
  onCancel: (reason: string) => Promise<void>;
}) {
  const [pauseReason, setPauseReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [loading, setLoading] = useState<"pause" | "resume" | "cancel" | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isPaused = circleStatus === "paused";
  const isActive = circleStatus === "active" || circleStatus === "delayed";
  const canPause = isActive;
  const canResume = isPaused;
  const canCancel = circleStatus === "draft";

  async function handlePause() {
    if (!pauseReason.trim()) return;
    setLoading("pause");
    try {
      await onPause(pauseReason.trim());
      setPauseReason("");
    } finally {
      setLoading(null);
    }
  }

  async function handleResume() {
    setLoading("resume");
    try {
      await onResume();
    } finally {
      setLoading(null);
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) return;
    setLoading("cancel");
    try {
      await onCancel(cancelReason.trim());
      setCancelReason("");
      setConfirmCancel(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to cancel this circle."
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6">
      {/* Current status banner */}
      {isPaused ? (
        <Alert>
          <CirclePause className="size-4" />
          <AlertTitle>Circle is paused</AlertTitle>
          <AlertDescription>
            All contributions and payouts are frozen. Review the situation and resume or cancel.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Pause action */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CirclePause className="size-5 text-[var(--color-warning-default)]" />
              <CardTitle>Emergency Pause</CardTitle>
            </div>
            <Badge variant={canPause ? "secondary" : "outline"}>
              {canPause ? "Available" : isPaused ? "Already paused" : "Not available"}
            </Badge>
          </div>
          <CardDescription>
            Immediately freeze all activity. Members are notified and no funds move.
          </CardDescription>
        </CardHeader>
        {canPause ? (
          <CardContent className="grid gap-3">
            <textarea
              className="min-h-[80px] w-full rounded-xl border border-border bg-white p-3 text-sm placeholder:text-muted-foreground focus:border-[var(--color-primary-default)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-muted)]"
              placeholder="Reason for pausing (visible to all members)..."
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
            />
            <Button
              variant="destructive"
              disabled={!pauseReason.trim() || loading === "pause"}
              onClick={handlePause}
            >
              {loading === "pause" ? "Pausing..." : "Pause Circle"}
            </Button>
          </CardContent>
        ) : null}
      </Card>

      {/* Resume action */}
      {canResume ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-[var(--color-success-default)]" />
              <CardTitle>Resume Circle</CardTitle>
            </div>
            <CardDescription>
              Unfreeze the circle. Contributions and payouts resume from where they left off.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              disabled={loading === "resume"}
              onClick={handleResume}
            >
              {loading === "resume" ? "Resuming..." : "Resume Circle"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Cancel action */}
      <Card className="border-[var(--color-error-default)]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleX className="size-5 text-[var(--color-error-default)]" />
              <CardTitle>Cancel Circle</CardTitle>
            </div>
            <Badge variant={canCancel ? "destructive" : "outline"}>
              {canCancel ? "Available" : "Pause first"}
            </Badge>
          </div>
          <CardDescription>
            Permanently end this circle. Collateral is returned. This cannot be undone.
          </CardDescription>
        </CardHeader>
        {canCancel ? (
          <CardContent className="grid gap-3">
            {!confirmCancel ? (
              <Button
                variant="destructive"
                onClick={() => setConfirmCancel(true)}
              >
                I want to cancel this circle
              </Button>
            ) : (
              <>
                <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertTitle>This action is permanent</AlertTitle>
                  <AlertDescription>
                    All collateral will be returned to members. The circle cannot be restarted.
                  </AlertDescription>
                </Alert>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-[var(--color-error-default)]/30 bg-white p-3 text-sm placeholder:text-muted-foreground focus:border-[var(--color-error-default)] focus:outline-none focus:ring-2 focus:ring-[var(--color-error-default)]/20"
                  placeholder="Reason for cancellation (visible to all members)..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    disabled={!cancelReason.trim() || loading === "cancel"}
                    onClick={handleCancel}
                  >
                    {loading === "cancel" ? "Cancelling..." : "Confirm Cancellation"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setConfirmCancel(false);
                      setCancelReason("");
                    }}
                  >
                    Go back
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
