"use client";

import { ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InfoTip } from "@/components/ui/info-tip";
import { Input } from "@/components/ui/input";
import type { CreateCollateralState } from "@/lib/mocks";

export function CreateCollateralStep({
  values,
  onChange,
  errors = {},
}: {
  values: CreateCollateralState;
  onChange: (values: CreateCollateralState) => void;
  errors?: Record<string, string>;
}) {
  return (
    <FieldGroup>
      <Alert>
        <ShieldAlert className="size-4" />
        <AlertTitle>Why set collateral?</AlertTitle>
        <AlertDescription>
          Collateral protects the group. Each member locks funds upfront — if someone
          misses a contribution, their collateral covers the pool so other members
          aren&apos;t left short. It builds trust without needing to rely solely on personal
          relationships.
        </AlertDescription>
      </Alert>

      <div className="grid gap-5 md:grid-cols-3">
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor="collateral-amount">Collateral Amount</FieldLabel>
            <InfoTip>Funds each member locks before the circle starts. Set this to at least one contribution amount for basic protection.</InfoTip>
          </div>
          <Input
            id="collateral-amount"
            type="number"
            min={0}
            value={values.collateralAmount}
            onChange={(event) =>
              onChange({ ...values, collateralAmount: Number(event.target.value) })
            }
            aria-invalid={!!errors.collateralAmount}
          />
          <FieldDescription>Locked per member until circle completes.</FieldDescription>
          {errors.collateralAmount ? (
            <FieldError>{errors.collateralAmount}</FieldError>
          ) : null}
        </Field>
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
            aria-invalid={!!errors.gracePeriodHours}
          />
          <FieldDescription>e.g. 4 hours gives a buffer for timezone issues.</FieldDescription>
          {errors.gracePeriodHours ? (
            <FieldError>{errors.gracePeriodHours}</FieldError>
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
            aria-invalid={!!errors.slashPercentage}
          />
          <FieldDescription>Slashed funds are injected into the pool.</FieldDescription>
          {errors.slashPercentage ? (
            <FieldError>{errors.slashPercentage}</FieldError>
          ) : null}
        </Field>
      </div>
    </FieldGroup>
  );
}
