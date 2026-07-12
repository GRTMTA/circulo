import type {
  CreateBasicsState,
  CreateCollateralState,
  CreateRosterMember,
} from "@/lib/mocks";

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates a Stellar public key (Ed25519).
 * A valid Stellar public key starts with 'G' and is 56 characters of base32.
 */
export function isValidStellarPublicKey(address: string): boolean {
  if (!address || address.length !== 56) return false;
  if (!address.startsWith("G")) return false;
  // Base32 alphabet used by Stellar (RFC 4648)
  return /^[A-Z2-7]{56}$/.test(address);
}

export function validateBasics(values: CreateBasicsState): ValidationResult {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) {
    errors.name = "Circle name is required.";
  } else if (values.name.trim().length < 3) {
    errors.name = "Name must be at least 3 characters.";
  }

  if (!values.contributionAmount || values.contributionAmount <= 0) {
    errors.contributionAmount = "Contribution must be greater than 0.";
  }

  if (values.memberCount < 2) {
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

  if (members.length < memberCount) {
    errors.roster = `Add ${memberCount - members.length} more member${memberCount - members.length > 1 ? "s" : ""} to fill the roster.`;
  }

  const invalidAddresses = members.filter(
    (m) => !isValidStellarPublicKey(m.walletAddress)
  );
  if (invalidAddresses.length > 0) {
    errors.walletAddress = `${invalidAddresses.length} address${invalidAddresses.length > 1 ? "es are" : " is"} not a valid Stellar public key.`;
  }

  const duplicates = members.filter(
    (m, i) => members.findIndex((other) => other.walletAddress === m.walletAddress) !== i
  );
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
  } else if (existingMembers.some((m) => m.walletAddress === walletAddress)) {
    errors.walletAddress = "This address is already in the roster.";
  }

  return errors;
}

export function validateCollateral(values: CreateCollateralState): ValidationResult {
  const errors: Record<string, string> = {};

  if (values.collateralAmount < 0) {
    errors.collateralAmount = "Collateral cannot be negative.";
  }

  if (values.gracePeriodHours < 0) {
    errors.gracePeriodHours = "Grace period cannot be negative.";
  } else if (values.gracePeriodHours === 0 && values.collateralAmount > 0) {
    errors.gracePeriodHours = "Set a grace period so members have time to pay before slashing.";
  }

  if (values.slashPercentage < 0 || values.slashPercentage > 100) {
    errors.slashPercentage = "Slash percentage must be between 0 and 100.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
