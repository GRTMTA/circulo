/**
 * Stellar's native asset and classic issued assets use seven decimal places.
 * Soroban token contracts receive integer base units, so 1 XLM is represented
 * by 10_000_000, never by the display value `1`.
 */
export const STELLAR_ASSET_DECIMALS = 7;
export const STELLAR_BASE_UNITS = BigInt("10000000");

function expandScientificNotation(value: string): string {
  const match = /^([+-]?)(\d+)(?:\.(\d*))?[eE]([+-]?\d+)$/.exec(value);
  if (!match) return value;

  const [, sign, integer, fraction = "", exponentValue] = match;
  const exponent = Number(exponentValue);
  const digits = integer + fraction;
  const decimalIndex = integer.length + exponent;

  if (decimalIndex <= 0) {
    return `${sign}0.${"0".repeat(-decimalIndex)}${digits}`;
  }
  if (decimalIndex >= digits.length) {
    return `${sign}${digits}${"0".repeat(decimalIndex - digits.length)}`;
  }
  return `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
}

/**
 * Converts an amount shown to a member (for example, `10` XLM) to Soroban
 * token base units (`100000000`). This intentionally rejects values with more
 * than seven decimal places instead of rounding, so a wallet can never be
 * charged a different amount than the creator entered.
 */
export function stellarAmountToBaseUnits(amount: number | string): bigint {
  const raw = typeof amount === "number" ? amount.toString() : amount.trim();
  const normalized = expandScientificNotation(raw);
  const match = /^(0|[1-9]\d*)(?:\.(\d+))?$/.exec(normalized);

  if (!match) {
    throw new Error("Amount must be a positive decimal amount.");
  }

  const [, whole, fraction = ""] = match;
  if (fraction.length > STELLAR_ASSET_DECIMALS) {
    throw new Error("Amounts may have at most 7 decimal places.");
  }

  const baseUnits =
    BigInt(whole) * STELLAR_BASE_UNITS +
    BigInt(fraction.padEnd(STELLAR_ASSET_DECIMALS, "0") || "0");

  if (baseUnits <= BigInt(0)) {
    throw new Error("Transaction amount must be greater than zero.");
  }

  return baseUnits;
}
