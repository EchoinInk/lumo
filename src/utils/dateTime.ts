export type LocalDateKey = string & { readonly __localDateKey: unique symbol };
export type WallClockTime = string & { readonly __wallClockTime: unique symbol };
export type TimestampInstant = string & { readonly __timestampInstant: unique symbol };

const LOCAL_DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const WALL_CLOCK_TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const TIMESTAMP_OFFSET = /(?:Z|[+-]\d{2}:\d{2})$/i;

interface DateParts {
  year: number;
  month: number;
  day: number;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDateParts({ year, month, day }: DateParts): LocalDateKey {
  return `${String(year).padStart(4, "0")}-${pad(month)}-${pad(day)}` as LocalDateKey;
}

function parseDateParts(value: string): DateParts | null {
  const match = LOCAL_DATE_KEY.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function isLocalDateKey(value: unknown): value is LocalDateKey {
  return typeof value === "string" && parseDateParts(value) !== null;
}

export function isWallClockTime(value: unknown): value is WallClockTime {
  return typeof value === "string" && WALL_CLOCK_TIME.test(value);
}

export function isTimestampInstant(value: unknown): value is TimestampInstant {
  return (
    typeof value === "string" &&
    TIMESTAMP_OFFSET.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

export function toTimestampInstant(date = new Date()): TimestampInstant {
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid timestamp date.");
  return date.toISOString() as TimestampInstant;
}

export function toLocalDateKey(
  date = new Date(),
  timeZone?: string,
): LocalDateKey {
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid local date.");

  if (!timeZone) {
    return formatDateParts({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    });
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value);
  return formatDateParts({
    year: part("year"),
    month: part("month"),
    day: part("day"),
  });
}

export function addLocalDays(value: string, days: number): LocalDateKey {
  const parts = parseDateParts(value);
  if (!parts || !Number.isInteger(days)) throw new Error("Invalid local date arithmetic.");
  const probe = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return formatDateParts({
    year: probe.getUTCFullYear(),
    month: probe.getUTCMonth() + 1,
    day: probe.getUTCDate(),
  });
}

export function addLocalMonths(value: string, months: number): LocalDateKey {
  const parts = parseDateParts(value);
  if (!parts || !Number.isInteger(months)) throw new Error("Invalid local month arithmetic.");

  const targetMonth = new Date(Date.UTC(parts.year, parts.month - 1 + months, 1));
  const targetYear = targetMonth.getUTCFullYear();
  const targetMonthIndex = targetMonth.getUTCMonth();
  const lastDay = new Date(Date.UTC(targetYear, targetMonthIndex + 1, 0)).getUTCDate();
  return formatDateParts({
    year: targetYear,
    month: targetMonthIndex + 1,
    day: Math.min(parts.day, lastDay),
  });
}

export function weekdayIndexForLocalDate(value: string): number {
  const parts = parseDateParts(value);
  if (!parts) throw new Error("Invalid local date key.");
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

export function localDateKeyToDate(
  value: string,
  time: string = "00:00",
): Date {
  const parts = parseDateParts(value);
  if (!parts || !isWallClockTime(time)) throw new Error("Invalid local date or time.");
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(parts.year, parts.month - 1, parts.day, hours, minutes, 0, 0);
}

export function formatLocalDate(
  value: string,
  options: Intl.DateTimeFormatOptions,
  locales?: Intl.LocalesArgument,
): string {
  return localDateKeyToDate(value).toLocaleDateString(locales, options);
}

export function millisecondsUntilNextLocalDay(now = new Date()): number {
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid local date.");
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  return Math.max(0, nextMidnight.getTime() - now.getTime());
}
