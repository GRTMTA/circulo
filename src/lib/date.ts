import { format, isValid, parseISO } from "date-fns";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateOnly(value: string | null | undefined) {
  if (!value) return undefined;

  const match = value.match(DATE_ONLY_PATTERN);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

export function serializeDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDateOnly(
  value: string | null | undefined,
  pattern = "MMM d, yyyy",
  fallback = "Unknown"
) {
  const date = parseDateOnly(value);
  return date ? format(date, pattern) : fallback;
}

export function formatTimestamp(
  value: string | null | undefined,
  pattern = "dd MMM yyyy, HH:mm",
  fallback = "Unknown"
) {
  if (!value) return fallback;

  const date = parseISO(value);
  return isValid(date) ? format(date, pattern) : fallback;
}

export function dateOnlyToIsoStart(value: string | null | undefined) {
  const date = parseDateOnly(value);
  if (!date) return null;

  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export function dateOnlyToIsoEnd(value: string | null | undefined) {
  const date = parseDateOnly(value);
  if (!date) return null;

  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}
