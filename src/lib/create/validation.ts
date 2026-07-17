import { StrKey } from "@stellar/stellar-sdk";

import { stellarAmountToBaseUnits } from "@/lib/stellar-amount";
import { isValidIanaTimeZone } from "@/lib/time-zone";
import type {
  CreateBasicsState,
  CreateCollateralState,
  CreateRosterMember,
} from "@/lib/create/types";

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Minimum members (with validated collateral) required before a circle can
 * start its first cycle. The roster can be created with fewer; the gate is
 * enforced at activation, not at creation.
 */
export const MIN_CYCLE_MEMBERS = 3;
export const MAX_CYCLE_COUNT = 12;

/**
 * Validates a Stellar public key (Ed25519).
 * A valid Stellar public key starts with 'G' and is 56 characters of base32.
 */
export function isValidStellarPublicKey(address: string): boolean {
  return StrKey.isValidEd25519PublicKey(address.trim().toUpperCase());
}

export function validateBasics(values: CreateBasicsState): ValidationResult {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) {
    errors.name = "Circle name is required.";
  } else if (values.name.trim().length < 3) {
    errors.name = "Name must be at least 3 characters.";
  }

  try {
    stellarAmountToBaseUnits(values.contributionAmount);
  } catch (error) {
    errors.contributionAmount =
      error instanceof Error ? error.message : "Contribution amount is invalid.";
  }

  if (!Number.isInteger(values.intervalSeconds) || values.intervalSeconds <= 0) {
    errors.intervalSeconds = "Contribution interval must be positive.";
  } else if (values.intervalSeconds % 86_400 !== 0) {
    errors.intervalSeconds = "Contribution interval must be a whole number of days.";
  }

  if (!isValidIanaTimeZone(values.timeZone)) {
    errors.timeZone = "Choose a valid IANA timezone, such as Asia/Manila.";
  }

  if (!Number.isInteger(values.cycleCount) || values.cycleCount < 1) {
    errors.cycleCount = "Choose at least one cycle.";
  } else if (values.cycleCount > MAX_CYCLE_COUNT) {
    errors.cycleCount = `A circle can run for at most ${MAX_CYCLE_COUNT} cycles.`;
  }

  if (!Number.isInteger(values.memberCount) || values.memberCount < 2) {
    errors.memberCount = "A circle needs at least 2 members.";
  } else if (values.memberCount > 20) {
    errors.memberCount = "Maximum 20 members allowed.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateRoster(
  members: CreateRosterMember[],
  memberCount: number
): ValidationResult {
  const errors: Record<string, string> = {};

  // The roster does not need to be full to create a circle. It only needs at
  // least the creator, and it must not exceed the configured capacity. The
  // minimum-to-start-a-cycle rule is enforced separately at activation.
  if (members.length < 1) {
    errors.roster = "Add at least yourself to the roster.";
  } else if (members.length > memberCount) {
    errors.roster = `This circle is limited to ${memberCount} members. Remove ${members.length - memberCount} to continue.`;
  }

  const invalidNames = members.filter((member) => !member.displayName.trim());
  if (invalidNames.length > 0) {
    errors.displayName = "Every member needs a display name.";
  }

  const invalidAddresses = members.filter(
    (m) => !isValidStellarPublicKey(m.walletAddress)
  );
  if (invalidAddresses.length > 0) {
    errors.walletAddress = `${invalidAddresses.length} address${invalidAddresses.length > 1 ? "es are" : " is"} not a valid Stellar public key.`;
  }

  const duplicates = members.filter((member, index) => {
    const address = member.walletAddress.trim().toUpperCase();
    return (
      members.findIndex(
        (other) => other.walletAddress.trim().toUpperCase() === address
      ) !== index
    );
  });
  if (duplicates.length > 0) {
    errors.duplicates = "Each member must have a unique wallet address.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateRosterEntry(
  displayName: string,
  walletAddress: string,
  existingMembers: CreateRosterMember[]
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!displayName.trim()) {
    errors.displayName = "Display name is required.";
  }

  if (!walletAddress.trim()) {
    errors.walletAddress = "Wallet address is required.";
  } else if (!isValidStellarPublicKey(walletAddress)) {
    errors.walletAddress = "Not a valid Stellar public key. Must start with G and be 56 characters.";
  } else if (
    existingMembers.some(
      (member) =>
        member.walletAddress.trim().toUpperCase() ===
        walletAddress.trim().toUpperCase()
    )
  ) {
    errors.walletAddress = "This address is already in the roster.";
  }

  return errors;
}

/**
 * Calculates required collateral dynamically based on the Paluwagan formula:
 * required_collateral(k) = ((N * C) - k) * A
 * where N = total members, C = complete circle rotations, k = the member's
 * first-cycle 1-indexed payout slot, and A = the contribution amount.
 */
export function calculateCollateral(
  numMembers: number,
  contributionAmount: number,
  payoutRound: number,
  cycleCount = 1
): number {
  if (
    payoutRound < 1 ||
    payoutRound > numMembers ||
    !Number.isInteger(cycleCount) ||
    cycleCount < 1
  ) {
    return 0;
  }
  return (numMembers * cycleCount - payoutRound) * contributionAmount;
}

export function validateCollateral(values: CreateCollateralState): ValidationResult {
  const errors: Record<string, string> = {};

  if (!Number.isFinite(values.gracePeriodHours) || values.gracePeriodHours < 0) {
    errors.gracePeriodHours = "Grace period cannot be negative.";
  }

  if (
    !Number.isFinite(values.slashPercentage) ||
    values.slashPercentage < 0 ||
    values.slashPercentage > 100
  ) {
    errors.slashPercentage = "Slash percentage must be between 0 and 100.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
