"use client";

import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Clock,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  Slash,
  Timer,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardCircle, DashboardMember } from "@/lib/dashboard/types";

// ─── Default Protection Flow (visual pipeline) ──────────────────────────────

interface FlowStep {
  icon: typeof Clock;
  title: string;
  description: string;
  status: "inactive" | "active" | "completed" | "danger";
}

function getFlowSteps(circle: DashboardCircle, member?: DashboardMember): FlowStep[] {
  const hasLateMembers = member ? member.lateCount > 0 : false;

  return [
    {
      icon: Clock,
      title: "Deadline passes",
      description: `Contribution is due each interval (${formatHours(circle.intervalSeconds / 3600)}). After the deadline, the grace period starts.`,
      status: "completed",
    },
    {
      icon: Timer,
      title: `Grace period (${circle.gracePeriodHours}h)`,
      description: `Member has ${circle.gracePeriodHours} hour${circle.gracePeriodHours !== 1 ? "s" : ""} to pay after missing the deadline. No penalty during this window.`,
      status: (member?.paymentStatus as string) === "grace_period" ? "active" : "inactive",
    },
    {
      icon: AlertTriangle,
      title: `Warning issued (threshold: ${circle.warningThreshold})`,
      description: `After ${circle.warningThreshold} late payment${circle.warningThreshold !== 1 ? "s" : ""}, the member receives an official warning visible to the group.`,
      status: hasLateMembers ? "active" : "inactive",
    },
    {
      icon: Slash,
      title: `Auto-slash (${circle.slashPercentage}% of collateral)`,
      description: circle.autoSlashEnabled
        ? `If grace period expires without payment, ${circle.slashPercentage}% of collateral is automatically slashed and injected into the pool.`
        : "Auto-slash is disabled for this circle. The creator must manually trigger slashing.",
      status: member?.collateralStatus === "partially_slashed" || member?.collateralStatus === "fully_slashed" ? "danger" : "inactive",
    },
    {
      icon: Ban,
      title: "Restriction from future circles",
      description: "Repeated defaults or fully slashed collateral results in a restriction flag. Restricted members cannot join new circles until cleared.",
      status: member?.restrictionStatus === "restricted" ? "danger" : "inactive",
    },
  ];
}

function formatHours(hours: number): string {
  if (hours >= 720) return `${Math.round(hours / 720)} month${hours >= 1440 ? "s" : ""}`;
  if (hours >= 168) return `${Math.round(hours / 168)} week${hours >= 336 ? "s" : ""}`;
  if (hours >= 24) return `${Math.round(hours / 24)} day${hours >= 48 ? "s" : ""}`;
  return `${hours} hour${hours !== 1 ? "s" : ""}`;
}

function FlowStepCard({ step, isLast }: { step: FlowStep; isLast: boolean }) {
  const colorMap = {
    inactive: "border-border bg-white text-muted-foreground",
    active: "border-[var(--color-warning-default)]/30 bg-[var(--color-warning-default)]/5",
    completed: "border-[var(--color-primary-default)]/20 bg-[var(--color-primary-muted)]/30",
    danger: "border-[var(--color-error-default)]/30 bg-[var(--color-error-default)]/5",
  };

  const iconColorMap = {
    inactive: "text-muted-foreground",
    active: "text-[var(--color-warning-default)]",
    completed: "text-[var(--color-primary-default)]",
    danger: "text-[var(--color-error-default)]",
  };

  return (
    <div className="flex items-stretch gap-3">
      <div className="flex flex-col items-center">
        <div className={`flex size-9 items-center justify-center rounded-full border ${colorMap[step.status]}`}>
          <step.icon className={`size-4 ${iconColorMap[step.status]}`} />
        </div>
        {!isLast ? (
          <div className="mt-1 flex-1 w-px bg-border" />
        ) : null}
      </div>
      <div className={`flex-1 rounded-xl border p-4 mb-3 ${colorMap[step.status]}`}>
        <p className="text-sm font-semibold text-[var(--color-text-default)]">{step.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
      </div>
    </div>
  );
}

// ─── Creator view: full rule configuration display ───────────────────────────

export function DefaultProtectionCreatorView({
  circle,
  members,
}: {
  circle: DashboardCircle;
  members: DashboardMember[];
}) {
  const lateMembers = members.filter((m) => m.lateCount > 0);
  const warnedMembers = members.filter((m) => m.restrictionStatus === "warning");
  const restrictedMembers = members.filter((m) => m.restrictionStatus === "restricted");
  const slashedMembers = members.filter((m) => m.slashedAmount > 0);

  return (
    <div className="grid gap-6">
      {/* Rule configuration summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-[var(--color-primary-default)]" />
            <CardTitle>Circle Agreement & Protection Rules</CardTitle>
          </div>
          <CardDescription>
            These rules are locked once the circle is activated and apply equally to all members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Grace Period</p>
              <p className="mt-1 text-lg font-bold">{circle.gracePeriodHours}h</p>
              <p className="mt-1 text-xs text-muted-foreground">Time after deadline before action</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Slash Rate</p>
              <p className="mt-1 text-lg font-bold">{circle.slashPercentage}%</p>
              <p className="mt-1 text-xs text-muted-foreground">Collateral taken per default</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Warning Threshold</p>
              <p className="mt-1 text-lg font-bold">{circle.warningThreshold} late</p>
              <p className="mt-1 text-xs text-muted-foreground">Payments before official warning</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Auto-Slash</p>
              <p className="mt-1 text-lg font-bold">{circle.autoSlashEnabled ? "Enabled" : "Manual"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{circle.autoSlashEnabled ? "Triggered automatically" : "Creator must approve"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flow visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Default Protection Flow</CardTitle>
          <CardDescription>
            Step-by-step escalation when a member misses a contribution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getFlowSteps(circle).map((step, index, arr) => (
            <FlowStepCard key={step.title} step={step} isLast={index === arr.length - 1} />
          ))}
        </CardContent>
      </Card>

      {/* Current member status overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-[var(--color-text-alternative)]" />
            <CardTitle>Member Status</CardTitle>
          </div>
          <CardDescription>
            Current default protection status across all members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4">
              <Clock className="size-5 text-[var(--color-warning-default)]" />
              <div>
                <p className="text-lg font-bold">{lateMembers.length}</p>
                <p className="text-xs text-muted-foreground">Late payments</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4">
              <AlertTriangle className="size-5 text-[var(--color-warning-default)]" />
              <div>
                <p className="text-lg font-bold">{warnedMembers.length}</p>
                <p className="text-xs text-muted-foreground">Warned</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4">
              <Slash className="size-5 text-[var(--color-error-default)]" />
              <div>
                <p className="text-lg font-bold">{slashedMembers.length}</p>
                <p className="text-xs text-muted-foreground">Slashed</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4">
              <Ban className="size-5 text-[var(--color-error-default)]" />
              <div>
                <p className="text-lg font-bold">{restrictedMembers.length}</p>
                <p className="text-xs text-muted-foreground">Restricted</p>
              </div>
            </div>
          </div>

          {/* Late members list */}
          {lateMembers.length > 0 ? (
            <div className="mt-4 grid gap-2">
              <p className="text-sm font-semibold text-muted-foreground">Members with late history</p>
              {lateMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-xl border border-border bg-white p-3">
                  <div>
                    <p className="text-sm font-semibold">{member.displayName}</p>
                    <p className="text-xs text-muted-foreground">{member.lateCount} late · {member.slashedAmount > 0 ? `${member.slashedAmount} slashed` : "No slash"}</p>
                  </div>
                  <Badge variant={member.restrictionStatus === "restricted" ? "destructive" : member.restrictionStatus === "warning" ? "secondary" : "outline"}>
                    {member.restrictionStatus === "clear" ? "Clear" : member.restrictionStatus === "warning" ? "Warned" : "Restricted"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Member view: personal protection status + rules ─────────────────────────

export function DefaultProtectionMemberView({
  circle,
  member,
}: {
  circle: DashboardCircle;
  member: DashboardMember;
}) {
  const steps = getFlowSteps(circle, member);

  return (
    <div className="grid gap-6">
      {/* Personal status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LockKeyhole className="size-5 text-[var(--color-primary-default)]" />
            <CardTitle>Your Protection Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Late Payments</p>
              <p className="mt-1 text-lg font-bold">{member.lateCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {member.lateCount === 0 ? "Clean record" : `Warning at ${circle.warningThreshold}`}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Collateral</p>
              <p className="mt-1 text-lg font-bold capitalize">{member.collateralStatus.replace("_", " ")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {member.slashedAmount > 0 ? `${member.slashedAmount} slashed` : "No slashing applied"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Standing</p>
              <p className="mt-1 text-lg font-bold capitalize">{member.restrictionStatus}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {member.restrictionStatus === "clear"
                  ? "Good standing"
                  : member.restrictionStatus === "warning"
                    ? "One more default may restrict"
                    : "Cannot join new circles"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Grace Period</p>
              <p className="mt-1 text-lg font-bold">{circle.gracePeriodHours}h</p>
              <p className="mt-1 text-xs text-muted-foreground">Window after each deadline</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flow visualization with member's current position */}
      <Card>
        <CardHeader>
          <CardTitle>How default protection works</CardTitle>
          <CardDescription>
            If you miss a contribution, here's what happens step by step. Pay during the grace period to avoid any penalty.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {steps.map((step, index) => (
            <FlowStepCard key={step.title} step={step} isLast={index === steps.length - 1} />
          ))}
        </CardContent>
      </Card>

      {/* Rules summary for transparency */}
      <Card>
        <CardHeader>
          <CardTitle>Circle protection rules</CardTitle>
          <CardDescription>
            Set by the creator and locked before activation. These apply equally to everyone.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {[
            `Grace period: ${circle.gracePeriodHours} hour${circle.gracePeriodHours !== 1 ? "s" : ""} after each deadline to pay without penalty.`,
            `Slash rate: ${circle.slashPercentage}% of your collateral is taken per default after grace period expires.`,
            `Warning threshold: After ${circle.warningThreshold} late payment${circle.warningThreshold !== 1 ? "s" : ""}, you receive an official warning.`,
            circle.autoSlashEnabled
              ? "Auto-slash is enabled — slashing happens automatically without creator intervention."
              : "Manual slash — the creator decides whether to slash after each default.",
            "Restricted members cannot create or join new circles until their standing is cleared.",
            "Slashed collateral is injected into the pool to cover the missing contribution.",
          ].map((rule) => (
            <div key={rule} className="flex gap-3 rounded-xl border border-border bg-white p-4 text-sm leading-relaxed">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--color-primary-default)]" />
              <span>{rule}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
