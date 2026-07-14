import type { CircleStatus } from "@/lib/dashboard/types";

export const AGREEMENT_RULES = [
  "This is not an investment, lending product, yield product, or public fundraiser.",
  "Contribution amount, member roster, payout order, collateral rules, and interval are locked before activation.",
  "Collateral may be slashed after missed contribution rules are met.",
  "The contract pays members directly. Circulo does not custody funds.",
  "Cash-in and cash-out are handled by external anchor providers, not Circulo.",
] as const;

export const POLICIES = {
  minMembers: 2,
  maxMembers: 20,

  minContribution: 1,

  minCollateralPercent: 10,
  maxCollateralPercent: 100,
  defaultCollateralPercent: 50,

  defaultGracePeriodHours: 4,
  minGracePeriodHours: 1,
  maxGracePeriodHours: 72,

  defaultSlashPercent: 100,
  minSlashPercent: 10,
  maxSlashPercent: 100,

  defaultWarningThreshold: 2,
  minWarningThreshold: 1,
  maxWarningThreshold: 10,

  minIntervalHours: 1,
  maxIntervalDays: 30,

  reminderSchedule: [24, 1] as const,

  maxAuditEvents: 50,
  maxNotifications: 20,
} as const;

export const VALID_TRANSITIONS: Record<CircleStatus, CircleStatus[]> = {
  draft: ["active", "cancelled"],
  active: ["paused", "delayed", "disputed", "completed", "cancelled"],
  paused: ["active", "cancelled"],
  delayed: ["active", "disputed", "cancelled"],
  disputed: ["active", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransition(from: CircleStatus, to: CircleStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export const CONTRIBUTION_ALLOWED_STATUSES: CircleStatus[] = ["active", "delayed"];

export const PAYOUT_ALLOWED_STATUSES: CircleStatus[] = ["active", "delayed"];

export const POOL_SETTINGS_LOCKED_STATUSES: CircleStatus[] = [
  "active",
  "paused",
  "delayed",
  "disputed",
  "completed",
  "cancelled",
];

export const EMERGENCY_ALLOWED_STATUSES: CircleStatus[] = [
  "active",
  "delayed",
  "disputed",
];
