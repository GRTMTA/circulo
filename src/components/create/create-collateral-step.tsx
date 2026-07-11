"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CreateCollateralState } from "@/lib/mocks";
import { ShieldAlert } from "lucide-react";

export function CreateCollateralStep({
  values,
  onChange,
}: {
  values: CreateCollateralState;
  onChange: (values: CreateCollateralState) => void;
}) {
  return (
    <FieldGroup>
      <Alert>
        <ShieldAlert className="size-4" />
        <AlertTitle>Default protection</AlertTitle>
        <AlertDescription>
          If a member misses a contribution, their collateral can be slashed and injected into the pool after the locked grace period.
        </AlertDescription>
      </Alert>
      <div className="grid gap-5 md:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="collateral-amount">Collateral Amount</FieldLabel>
          <Input id="collateral-amount" type="number" min={0} value={values.collateralAmount} onChange={(event) => onChange({ ...values, collateralAmount: Number(event.target.value) })} />
        </Field>
        <Field>
          <FieldLabel htmlFor="grace-hours">Grace Period Hours</FieldLabel>
          <Input id="grace-hours" type="number" min={0} value={values.gracePeriodHours} onChange={(event) => onChange({ ...values, gracePeriodHours: Number(event.target.value) })} />
        </Field>
        <Field>
          <FieldLabel htmlFor="slash-percentage">Slash Percentage</FieldLabel>
          <Input id="slash-percentage" type="number" min={0} max={100} value={values.slashPercentage} onChange={(event) => onChange({ ...values, slashPercentage: Number(event.target.value) })} />
        </Field>
      </div>
    </FieldGroup>
  );
}

