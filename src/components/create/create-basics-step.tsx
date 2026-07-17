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
import { formatIntervalSeconds } from "@/lib/create/interval";
import { CIRCLE_TIME_ZONES } from "@/lib/time-zone";
import { MAX_CYCLE_COUNT } from "@/lib/create/validation";

const SECONDS_PER_DAY = 86_400;

export function CreateBasicsStep({
  values,
  onChange,
  errors = {},
}: {
  values: CreateBasicsState;
  onChange: (values: CreateBasicsState) => void;
  errors?: Record<string, string>;
}) {
  function handleIntervalDays(rawValue: string) {
    const digitsOnly = rawValue.replace(/[^\d]/g, "").replace(/^0+/, "");
    const days = digitsOnly === "" ? 0 : Number(digitsOnly);
    onChange({ ...values, intervalSeconds: days * SECONDS_PER_DAY });
  }

  function handleMemberCount(rawValue: string) {
    // Never allow a leading zero or empty-to-zero; keep the field usable while typing.
    const digitsOnly = rawValue.replace(/[^\d]/g, "").replace(/^0+/, "");
    onChange({ ...values, memberCount: digitsOnly === "" ? 0 : Number(digitsOnly) });
  }

  function handleCycleCount(rawValue: string) {
    const digitsOnly = rawValue.replace(/[^\d]/g, "").replace(/^0+/, "");
    onChange({ ...values, cycleCount: digitsOnly === "" ? 0 : Number(digitsOnly) });
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
            step="0.0000001"
            value={values.contributionAmount}
            onChange={(event) =>
              onChange({ ...values, contributionAmount: Number(event.target.value) })
            }
            aria-invalid={!!errors.contributionAmount}
          />
          <FieldDescription>
            Exactly this amount is charged each round (up to 7 decimal places).
          </FieldDescription>
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
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor="contribution-interval-days" required>Contribution Interval</FieldLabel>
            <InfoTip>How many calendar days pass between each contribution deadline.</InfoTip>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="contribution-interval-days"
              type="text"
              inputMode="numeric"
              value={
                values.intervalSeconds > 0
                  ? String(values.intervalSeconds / SECONDS_PER_DAY)
                  : ""
              }
              onChange={(event) => handleIntervalDays(event.target.value)}
              aria-invalid={!!errors.intervalSeconds}
            />
            <span className="shrink-0 text-sm text-muted-foreground">days</span>
          </div>
          <FieldDescription>
            {values.intervalSeconds > 0
              ? `Members contribute every ${formatIntervalSeconds(values.intervalSeconds)}.`
              : "Enter how many days are between contributions."}
          </FieldDescription>
          {errors.intervalSeconds ? <FieldError>{errors.intervalSeconds}</FieldError> : null}
        </Field>
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor="circle-time-zone" required>Circle Timezone</FieldLabel>
            <InfoTip>All deadlines and reminders use this shared timezone, regardless of each member&apos;s location.</InfoTip>
          </div>
          <Input
            id="circle-time-zone"
            list="circle-time-zone-options"
            value={values.timeZone}
            onChange={(event) => onChange({ ...values, timeZone: event.target.value })}
            placeholder="Asia/Manila"
            autoComplete="off"
            aria-invalid={!!errors.timeZone}
          />
          <datalist id="circle-time-zone-options">
            {CIRCLE_TIME_ZONES.map((timeZone) => (
              <option key={timeZone} value={timeZone} />
            ))}
          </datalist>
          <FieldDescription>Default: Asia/Manila (Philippines).</FieldDescription>
          {errors.timeZone ? <FieldError>{errors.timeZone}</FieldError> : null}
        </Field>
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor="cycle-count" required>Number of Cycles</FieldLabel>
            <InfoTip>A cycle is one complete payout rotation. Every member receives one payout in each cycle.</InfoTip>
          </div>
          <Input
            id="cycle-count"
            type="text"
            inputMode="numeric"
            value={values.cycleCount === 0 ? "" : String(values.cycleCount)}
            onChange={(event) => handleCycleCount(event.target.value)}
            placeholder="e.g. 3"
            aria-invalid={!!errors.cycleCount}
          />
          <FieldDescription>
            {values.memberCount > 0 && values.cycleCount > 0
              ? `${values.memberCount * values.cycleCount} total payout rounds.`
              : `Choose 1–${MAX_CYCLE_COUNT} complete rotations.`}
          </FieldDescription>
          {errors.cycleCount ? <FieldError>{errors.cycleCount}</FieldError> : null}
        </Field>
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor="member-count" required>Member Count</FieldLabel>
            <InfoTip>Total members including yourself. Each member receives one payout during every cycle.</InfoTip>
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
