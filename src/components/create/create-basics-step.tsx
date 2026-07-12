"use client";

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InfoTip } from "@/components/ui/info-tip";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateBasicsState } from "@/lib/mocks";

export function CreateBasicsStep({
  values,
  onChange,
  errors = {},
}: {
  values: CreateBasicsState;
  onChange: (values: CreateBasicsState) => void;
  errors?: Record<string, string>;
}) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="circle-name">Circle Name</FieldLabel>
        <Input
          id="circle-name"
          value={values.name}
          onChange={(event) => onChange({ ...values, name: event.target.value })}
          aria-invalid={!!errors.name}
        />
        <FieldDescription>A private name your members will recognize.</FieldDescription>
        {errors.name ? <FieldError>{errors.name}</FieldError> : null}
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor="contribution-amount">Contribution Amount</FieldLabel>
            <InfoTip>The fixed amount each member pays per round. All contributions go to one member each cycle.</InfoTip>
          </div>
          <Input
            id="contribution-amount"
            type="number"
            min={1}
            value={values.contributionAmount}
            onChange={(event) =>
              onChange({ ...values, contributionAmount: Number(event.target.value) })
            }
            aria-invalid={!!errors.contributionAmount}
          />
          {errors.contributionAmount ? (
            <FieldError>{errors.contributionAmount}</FieldError>
          ) : null}
        </Field>
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel>Asset</FieldLabel>
            <InfoTip>The Stellar token used for contributions and payouts.</InfoTip>
          </div>
          <Select
            value={values.contributionAsset}
            onValueChange={(value) =>
              onChange({ ...values, contributionAsset: value as "USDC" | "USDT" })
            }
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USDC">USDC on Stellar</SelectItem>
              <SelectItem value="USDT">USDT on Stellar</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel>Interval</FieldLabel>
            <InfoTip>How often members contribute. Shorter intervals mean faster payouts for everyone.</InfoTip>
          </div>
          <Select
            value={String(values.intervalSeconds)}
            onValueChange={(value) => onChange({ ...values, intervalSeconds: Number(value) })}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="86400">Every 24 hours</SelectItem>
              <SelectItem value="604800">Every 7 days</SelectItem>
              <SelectItem value="2592000">Every 30 days</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor="member-count">Member Count</FieldLabel>
            <InfoTip>Total members including yourself. Each member receives one payout — more members means more rounds.</InfoTip>
          </div>
          <Input
            id="member-count"
            type="number"
            min={2}
            max={20}
            value={values.memberCount}
            onChange={(event) => onChange({ ...values, memberCount: Number(event.target.value) })}
            aria-invalid={!!errors.memberCount}
          />
          {errors.memberCount ? <FieldError>{errors.memberCount}</FieldError> : null}
        </Field>
      </div>
    </FieldGroup>
  );
}
