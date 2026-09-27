import type { RecurrencePattern, Weekday } from "../types/recurrence";
import {
  addLocalDays,
  addLocalMonths,
  isLocalDateKey,
  weekdayIndexForLocalDate,
} from "@/src/utils/dateTime";

const weekdays: Weekday[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function normalizedInterval(pattern: RecurrencePattern): number {
  return pattern.type === "none" ? 1 : Math.max(1, pattern.interval ?? 1);
}

function laterDate(left: string, right: string): string {
  return left > right ? left : right;
}

export function summarizeRecurrence(pattern?: RecurrencePattern): string {
  if (!pattern || pattern.type === "none") return "Does not repeat";

  if (pattern.type === "daily") {
    const interval = pattern.interval ?? 1;
    return interval === 1 ? "Every day" : `Every ${interval} days`;
  }

  if (pattern.type === "weekly") {
    const interval = pattern.interval ?? 1;
    const selected = pattern.weekdays ?? [];

    if (selected.length === 5 && selected.every((day) => day !== "Sun" && day !== "Sat")) {
      return "Weekdays";
    }

    if (selected.length === 1 && interval === 1) {
      return `Every ${selected[0]}`;
    }

    if (selected.length > 0 && interval === 1) {
      return `Every ${selected.join(", ")}`;
    }

    return interval === 1 ? "Every week" : `Every ${interval} weeks`;
  }

  const interval = pattern.interval ?? 1;
  return interval === 1 ? "Every month" : `Every ${interval} months`;
}

export function getNextOccurrence(
  fromDate: string,
  pattern?: RecurrencePattern,
): string | null {
  return getNextOccurrenceAfter(fromDate, pattern, fromDate, fromDate);
}

/**
 * Return the first scheduled occurrence after both the current occurrence and
 * the supplied floor date. Only one future occurrence is returned, so opening
 * the app after a long gap never materializes a backlog.
 */
export function getNextOccurrenceAfter(
  fromDate: string,
  pattern: RecurrencePattern | undefined,
  afterDate: string,
  anchorDate = fromDate,
): string | null {
  if (
    !pattern ||
    pattern.type === "none" ||
    !isLocalDateKey(fromDate) ||
    !isLocalDateKey(afterDate) ||
    !isLocalDateKey(anchorDate)
  ) {
    return null;
  }

  const floor = laterDate(fromDate, afterDate);
  const interval = normalizedInterval(pattern);

  if (pattern.type === "daily") {
    let candidate = addLocalDays(anchorDate, interval);
    while (candidate <= floor) candidate = addLocalDays(candidate, interval);
    return candidate;
  }

  if (pattern.type === "monthly") {
    let step = interval;
    let candidate = addLocalMonths(anchorDate, step);
    while (candidate <= floor) {
      step += interval;
      candidate = addLocalMonths(anchorDate, step);
    }
    return candidate;
  }

  const selected = [...new Set(pattern.weekdays ?? [])];
  if (selected.length === 0) {
    let candidate = addLocalDays(anchorDate, 7 * interval);
    while (candidate <= floor) candidate = addLocalDays(candidate, 7 * interval);
    return candidate;
  }

  const anchorWeekStart = addLocalDays(
    anchorDate,
    -weekdayIndexForLocalDate(anchorDate),
  );
  for (let offset = 1; offset <= 3660; offset++) {
    const candidate = addLocalDays(floor, offset);
    const daysFromAnchorWeek = Math.round(
      (Date.parse(`${candidate}T00:00:00Z`) -
        Date.parse(`${anchorWeekStart}T00:00:00Z`)) /
        86_400_000,
    );
    const weekOffset = Math.floor(daysFromAnchorWeek / 7);
    if (
      weekOffset >= 0 &&
      weekOffset % interval === 0 &&
      selected.includes(weekdays[weekdayIndexForLocalDate(candidate)])
    ) {
      return candidate;
    }
  }

  return null;
}
