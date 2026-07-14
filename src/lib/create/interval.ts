export type IntervalUnit = "hours" | "days";

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;

/** Formats a raw interval in seconds into a human label like "7 days". */
export function formatIntervalSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "";

  if (totalSeconds % SECONDS_PER_DAY === 0) {
    const days = totalSeconds / SECONDS_PER_DAY;
    return `${days} day${days === 1 ? "" : "s"}`;
  }

  if (totalSeconds % SECONDS_PER_HOUR === 0) {
    const hours = totalSeconds / SECONDS_PER_HOUR;
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  const minutes = Math.round(totalSeconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

/** Converts a custom value + unit into seconds. */
export function toIntervalSeconds(value: number, unit: IntervalUnit): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value) * (unit === "days" ? SECONDS_PER_DAY : SECONDS_PER_HOUR);
}
