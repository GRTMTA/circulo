"use client";

import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
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
}: {
  values: CreateBasicsState;
  onChange: (values: CreateBasicsState) => void;
}) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="circle-name">Circle Name</FieldLabel>
        <Input
          id="circle-name"
          value={values.name}
          onChange={(event) => onChange({ ...values, name: event.target.value })}
        />
        <FieldDescription>Use a private group name members will recognize.</FieldDescription>
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="contribution-amount">Contribution Amount</FieldLabel>
          <Input
            id="contribution-amount"
            type="number"
            min={1}
            value={values.contributionAmount}
            onChange={(event) =>
              onChange({ ...values, contributionAmount: Number(event.target.value) })
            }
          />
        </Field>
        <Field>
          <FieldLabel>Asset</FieldLabel>
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
          <FieldLabel>Interval</FieldLabel>
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
          <FieldLabel htmlFor="member-count">Member Count</FieldLabel>
          <Input
            id="member-count"
            type="number"
            min={2}
            max={20}
            value={values.memberCount}
            onChange={(event) => onChange({ ...values, memberCount: Number(event.target.value) })}
          />
        </Field>
      </div>
    </FieldGroup>
  );
}

