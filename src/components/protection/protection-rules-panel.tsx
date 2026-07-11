import { ShieldAlert, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressLabel } from "@/components/ui/progress";

export function ProtectionRulesPanel({
  protection = {
    gracePeriodHours: 4,
    slashPercentage: 100,
    warningThreshold: 2,
    members: [],
  },
}: {
  protection?: {
    gracePeriodHours: number;
    slashPercentage: number;
    warningThreshold: number;
    members: { name: string; status: string; lateCount: number }[];
  };
}) {
  return (
    <div className="grid gap-4">
      <Alert>
        <ShieldCheck className="size-4" />
        <AlertTitle>Default protection is rule-locked</AlertTitle>
        <AlertDescription>
          Grace period, slashing, injection, and restriction rules are visible before activation.
        </AlertDescription>
      </Alert>
      <div className="grid gap-3 md:grid-cols-2">
        {[
          `Grace period: ${protection.gracePeriodHours} hours`,
          `Auto-slash: ${protection.slashPercentage}% collateral`,
          `Warning threshold: ${protection.warningThreshold} late events`,
          "Slashed collateral is injected into the pool",
          "Restricted members cannot join future circles",
        ].map((rule) => (
          <div key={rule} className="rounded-xl border border-border bg-white p-4 text-sm font-semibold">
            {rule}
          </div>
        ))}
      </div>
      {protection.members.length > 0 ? (
        <div className="grid gap-3">
          {protection.members.map((member) => (
            <div key={member.name} className="rounded-xl border border-border bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-semibold">{member.name}</p>
                <Badge variant={member.status === "restricted" ? "destructive" : "outline"}>{member.status}</Badge>
              </div>
              <Progress value={Math.min(100, (member.lateCount / protection.warningThreshold) * 100)}>
                <ProgressLabel>Late count</ProgressLabel>
                <span className="ml-auto text-sm tabular-nums">{member.lateCount}</span>
              </Progress>
            </div>
          ))}
        </div>
      ) : null}
      <Alert variant="destructive">
        <ShieldAlert className="size-4" />
        <AlertTitle>Creator cannot redirect funds</AlertTitle>
        <AlertDescription>Pause and default tools stop cycle actions; they do not give custody to the creator.</AlertDescription>
      </Alert>
    </div>
  );
}

