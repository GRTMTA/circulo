"use client";

import Link from "next/link";
import { CalendarDays, PlusCircle, ShieldCheck, UsersRound } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { CirclesDTO, CircleListItem } from "@/lib/dashboard/types";

function titleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (["cancelled", "disputed", "late", "missed"].includes(status)) return "destructive";
  if (["active", "completed", "paid"].includes(status)) return "default";
  if (["draft", "pending", "scheduled"].includes(status)) return "secondary";
  return "outline";
}

function CircleCard({ circle }: { circle: CircleListItem }) {
  return (
    <Card className="trust-ledger-surface transition-transform duration-200 hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="text-lg">
            <ShieldCheck className="size-4 text-primary" />
            {circle.name}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusVariant(circle.status)}>{titleCase(circle.status)}</Badge>
            <Badge variant="outline">{titleCase(circle.role)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Contribution</p>
            <p className="mt-1 font-semibold tabular-nums">
              {circle.contributionAmount} {circle.contributionAsset}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Round</p>
            <p className="mt-1 font-semibold tabular-nums">
              {circle.currentRound} / {circle.totalRounds}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Members</p>
            <p className="mt-1 font-semibold tabular-nums">{circle.memberCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Next due</p>
            <p className="mt-1 font-semibold">{formatDate(circle.nextDueAt)}</p>
          </div>
        </div>
        {circle.role === "member" ? (
          <div className="flex flex-wrap gap-2">
            {circle.myPaymentStatus ? (
              <Badge variant={statusVariant(circle.myPaymentStatus)}>
                {titleCase(circle.myPaymentStatus)}
              </Badge>
            ) : null}
            {circle.myPayoutRound ? (
              <Badge variant="outline">Payout round {circle.myPayoutRound}</Badge>
            ) : null}
          </div>
        ) : null}
        <Button render={<Link href={`/dashboard/${circle.id}`} />} nativeButton={false}>
          Open circle
        </Button>
      </CardContent>
    </Card>
  );
}

export function CircleList({ circles }: { circles: CirclesDTO }) {
  const createButton = (
    <Button render={<Link href="/dashboard/create" />} nativeButton={false}>
      <PlusCircle className="size-4" />
      Create Circle
    </Button>
  );

  if (circles.length === 0) {
    return (
      <DashboardShell
        title="Your Circles"
        description="Create or accept an invite-only circle to begin."
        breadcrumbItems={[]}
        headerTopRow={createButton}
      >
        <EmptyState
          icon={<UsersRound className="size-8" />}
          title="No circles yet"
          description="Circulo keeps every pool invite-only, fixed-roster, and rule-locked before activation."
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Your Circles"
      description="Switch between circles, check payment readiness, and inspect the next action for each pool."
      breadcrumbItems={[]}
      headerTopRow={createButton}
    >
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {circles.map((circle) => (
          <CircleCard key={circle.id} circle={circle} />
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
        <CalendarDays className="mr-2 inline size-4 text-primary" />
        Circle setup, payouts, collateral, and reminders stay scoped to the selected circle.
      </div>
    </DashboardShell>
  );
}

