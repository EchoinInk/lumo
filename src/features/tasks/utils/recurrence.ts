import type { RecurrencePattern, Weekday } from "../types/recurrence";
import {
  addLocalDays,
  addLocalMonths,
  isLocalDateKey,
  weekdayIndexForLocalDate,
} from "@/src/utils/dateTime";

const weekdays: Weekday[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  if (!pattern || pattern.type === "none") return null;
  if (!isLocalDateKey(fromDate)) return null;

  if (pattern.type === "daily") {
    return addLocalDays(fromDate, pattern.interval ?? 1);
  }

  if (pattern.type === "weekly") {
    const selected = pattern.weekdays ?? [];
    if (selected.length === 0) {
      return addLocalDays(fromDate, 7 * (pattern.interval ?? 1));
    }

    for (let offset = 1; offset <= 14 * (pattern.interval ?? 1); offset++) {
      const next = addLocalDays(fromDate, offset);
      if (selected.includes(weekdays[weekdayIndexForLocalDate(next)])) {
        return next;
      }
    }
  }

  if (pattern.type === "monthly") {
    return addLocalMonths(fromDate, pattern.interval ?? 1);
  }

  return null;
}
