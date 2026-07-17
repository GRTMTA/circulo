export const DEFAULT_CIRCLE_TIME_ZONE = "Asia/Manila";

type IntlWithSupportedValuesOf = typeof Intl & {
  supportedValuesOf?: (key: "timeZone") => string[];
};

const supportedTimeZones = (Intl as IntlWithSupportedValuesOf).supportedValuesOf?.(
  "timeZone"
);

/**
 * IANA time zones are stable identifiers such as `Asia/Manila` and
 * `America/New_York`. Keep the Philippines first while offering the platform's
 * complete timezone list to members in other countries.
 */
export const CIRCLE_TIME_ZONES = Array.from(
  new Set([DEFAULT_CIRCLE_TIME_ZONE, "UTC", ...(supportedTimeZones ?? [])])
);

export function isValidIanaTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}
