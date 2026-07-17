"use client";

import { ShieldAlert, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InfoTip } from "@/components/ui/info-tip";
import { Input } from "@/components/ui/input";
import type { CreateCollateralState } from "@/lib/create/types";

export function CreateCollateralStep({
  values,
  onChange,
  memberCount,
  cycleCount,
  contributionAmount,
  contributionAsset,
  fieldErrors = {},
}: {
  values: CreateCollateralState;
  onChange: (values: CreateCollateralState) => void;
  memberCount: number;
  cycleCount: number;
  contributionAmount: number;
  contributionAsset: string;
  fieldErrors?: Record<string, string>;
}) {
  const N = memberCount;
  const A = contributionAmount;
  const asset = contributionAsset;

  const totalRounds = N * cycleCount;

  // Collateral covers every contribution owed after the member's first payout:
  // ((N * C) - k) * A.
  const collateralRows = Array.from({ length: N }, (_, i) => {
    const k = i + 1;
    const remaining = totalRounds - k;
    const required = remaining * A;
    return { k, remaining, required };
  });

  return (
    <FieldGroup>
      <Alert>
        <ShieldAlert className="size-4 text-[var(--color-primary-default)]" />
        <AlertTitle>How Collateral Protects the Group</AlertTitle>
        <AlertDescription>
          In informal Paluwagan groups, a major risk is members taking their payout early and defaulting on subsequent rounds. 
          Circulo solves this by dynamically locking a collateral buffer from each member upfront, which is automatically slashed 
          to cover missed rounds.
        </AlertDescription>
      </Alert>

      {/* Dynamic Collateral Table */}
      <div className="rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-background-muted)]/20 p-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2 text-[var(--color-text-default)]">
          <Sparkles className="size-4 text-[var(--color-primary-default)]" />
          Required Collateral per Payout Slot
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Calculated using the formula: <code className="font-mono text-indigo-500 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">Required Collateral = ((Members × Cycles) - First Payout Slot) × Contribution</code>
        </p>

        <div className="overflow-hidden rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-background-default)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[var(--color-background-muted)]/70 text-muted-foreground font-semibold border-b border-[var(--color-border-muted)]">
              <tr>
                <th className="p-3">Payout Slot (k)</th>
                <th className="p-3">Remaining Obligations</th>
                <th className="p-3 text-right">Required Collateral</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-muted)]">
              {collateralRows.map(({ k, remaining, required }) => (
                <tr key={k} className="hover:bg-[var(--color-background-muted)]/20 transition-colors">
                  <td className="p-3 font-medium">Round {k} {k === N ? "(Last Slot)" : ""}</td>
                  <td className="p-3 text-muted-foreground">{remaining} obligations after first payout</td>
                  <td className="p-3 text-right font-mono font-semibold text-[var(--color-text-default)]">
                    {required.toLocaleString()} {asset}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor="grace-hours">Grace Period (hours)</FieldLabel>
            <InfoTip>Time after a missed deadline before slashing kicks in. Gives members a chance to pay late without penalty.</InfoTip>
          </div>
          <Input
            id="grace-hours"
            type="number"
            min={0}
            value={values.gracePeriodHours}
            onChange={(event) =>
              onChange({ ...values, gracePeriodHours: Number(event.target.value) })
            }
            aria-invalid={!!fieldErrors.gracePeriodHours}
          />
          <FieldDescription>e.g. 4 hours gives a buffer for timezone issues.</FieldDescription>
          {fieldErrors.gracePeriodHours ? (
            <FieldError>{fieldErrors.gracePeriodHours}</FieldError>
          ) : null}
        </Field>

        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor="slash-percentage">Slash %</FieldLabel>
            <InfoTip>How much of the collateral gets taken on a missed payment. 100% is strict, lower values are more forgiving.</InfoTip>
          </div>
          <Input
            id="slash-percentage"
            type="number"
            min={0}
            max={100}
            value={values.slashPercentage}
            onChange={(event) =>
              onChange({ ...values, slashPercentage: Number(event.target.value) })
            }
            aria-invalid={!!fieldErrors.slashPercentage}
          />
          <FieldDescription>Slashed funds are injected into the pool.</FieldDescription>
          {fieldErrors.slashPercentage ? (
            <FieldError>{fieldErrors.slashPercentage}</FieldError>
          ) : null}
        </Field>
      </div>
    </FieldGroup>
  );
}
