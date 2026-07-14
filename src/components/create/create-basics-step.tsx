"use client";

import { useState } from "react";

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
import type { CreateBasicsState } from "@/lib/create/types";
import { formatIntervalSeconds, toIntervalSeconds, type IntervalUnit } from "@/lib/create/interval";

const PRESET_INTERVALS = [86400, 604800, 2592000];

export function CreateBasicsStep({
  values,
  onChange,
  errors = {},
}: {
  values: CreateBasicsState;
  onChange: (values: CreateBasicsState) => void;
  errors?: Record<string, string>;
}) {
  const isPreset = PRESET_INTERVALS.includes(values.intervalSeconds);
  const [isCustom, setIsCustom] = useState(!isPreset && values.intervalSeconds > 0);
  const [customValue, setCustomValue] = useState(() =>
    isPreset ? "7" : String(Math.max(1, Math.round(values.intervalSeconds / 86400)))
  );
  const [customUnit, setCustomUnit] = useState<IntervalUnit>("days");

  const intervalSelectValue = isCustom ? "custom" : String(values.intervalSeconds);

  function handleIntervalSelect(value: string) {
    if (value === "custom") {
      setIsCustom(true);
      onChange({ ...values, intervalSeconds: toIntervalSeconds(Number(customValue) || 0, customUnit) });
      return;
    }
    setIsCustom(false);
    onChange({ ...values, intervalSeconds: Number(value) });
  }

  function handleCustomValue(rawValue: string) {
    setCustomValue(rawValue);
    onChange({ ...values, intervalSeconds: toIntervalSeconds(Number(rawValue) || 0, customUnit) });
  }

  function handleCustomUnit(unit: IntervalUnit) {
    setCustomUnit(unit);
    onChange({ ...values, intervalSeconds: toIntervalSeconds(Number(customValue) || 0, unit) });
  }

  function handleMemberCount(rawValue: string) {
    // Never allow a leading zero or empty-to-zero; keep the field usable while typing.
    const digitsOnly = rawValue.replace(/[^\d]/g, "").replace(/^0+/, "");
    onChange({ ...values, memberCount: digitsOnly === "" ? 0 : Number(digitsOnly) });
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="circle-name" required>Circle Name</FieldLabel>
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
            <FieldLabel htmlFor="contribution-amount" required>Contribution Amount</FieldLabel>
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
            <FieldLabel required>Asset</FieldLabel>
            <InfoTip>The Stellar token used for contributions and payouts.</InfoTip>
          </div>
          <Select
            value={values.contributionAsset}
            onValueChange={(value) =>
              onChange({ ...values, contributionAsset: value as "USDC" | "USDT" | "XLM" })
            }
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USDC">USDC on Stellar</SelectItem>
              <SelectItem value="USDT">USDT on Stellar</SelectItem>
              <SelectItem value="XLM">XLM (Stellar Lumens)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel required>Interval</FieldLabel>
            <InfoTip>How often members contribute. Shorter intervals mean faster payouts for everyone.</InfoTip>
          </div>
          <Select value={intervalSelectValue} onValueChange={handleIntervalSelect}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="86400">Every 24 hours</SelectItem>
              <SelectItem value="604800">Every 7 days</SelectItem>
              <SelectItem value="2592000">Every 30 days</SelectItem>
              <SelectItem value="custom">Custom interval…</SelectItem>
            </SelectContent>
          </Select>
          {isCustom ? (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input
                type="number"
                min={1}
                value={customValue}
                onChange={(event) => handleCustomValue(event.target.value)}
                aria-label="Custom interval value"
                aria-invalid={!!errors.intervalSeconds}
              />
              <Select value={customUnit} onValueChange={(value) => handleCustomUnit(value as IntervalUnit)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <FieldDescription>
            {values.intervalSeconds > 0
              ? `Members contribute every ${formatIntervalSeconds(values.intervalSeconds)}.`
              : "Choose how often members contribute."}
          </FieldDescription>
          {errors.intervalSeconds ? <FieldError>{errors.intervalSeconds}</FieldError> : null}
        </Field>
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor="member-count" required>Member Count</FieldLabel>
            <InfoTip>Total members including yourself. Each member receives one payout — more members means more rounds.</InfoTip>
          </div>
          <Input
            id="member-count"
            type="text"
            inputMode="numeric"
            value={values.memberCount === 0 ? "" : String(values.memberCount)}
            onChange={(event) => handleMemberCount(event.target.value)}
            placeholder="e.g. 6"
            aria-invalid={!!errors.memberCount}
          />
          {errors.memberCount ? <FieldError>{errors.memberCount}</FieldError> : null}
        </Field>
      </div>
    </FieldGroup>
  );
}
