import { getNextOccurrenceAfter } from "@/features/tasks/utils/recurrence";
import { addLocalDays, isLocalDateKey } from "@/utils/dateTime";
import type { CleaningItem } from "../types/cleaning";

export interface CleaningOccurrence {
  itemId: string;
  date: string;
  completed: boolean;
}

export function cleaningOccurrenceDates(
  item: Pick<CleaningItem, "startDate" | "recurrence">,
  fromDate: string,
  toDate: string,
): string[] {
  if (
    !isLocalDateKey(item.startDate) ||
    !isLocalDateKey(fromDate) ||
    !isLocalDateKey(toDate) ||
    fromDate > toDate ||
    item.startDate > toDate
  ) return [];

  if (item.recurrence.type === "none") {
    return item.startDate >= fromDate ? [item.startDate] : [];
  }

  const dates: string[] = [];
  let occurrence: string = item.startDate;
  let guard = 0;
  while (occurrence <= toDate && guard < 5000) {
    if (occurrence >= fromDate) dates.push(occurrence);
    const next = getNextOccurrenceAfter(
      occurrence,
      item.recurrence,
      occurrence,
      item.startDate,
    );
    if (!next || next <= occurrence) break;
    occurrence = next;
    guard += 1;
  }
  return dates;
}

export function cleaningOccurrences(
  items: CleaningItem[],
  fromDate: string,
  toDate: string,
): CleaningOccurrence[] {
  return items.flatMap((item) =>
    cleaningOccurrenceDates(item, fromDate, toDate).map((date) => ({
      itemId: item.id,
      date,
      completed: item.completedDates.includes(date),
    })),
  );
}

export function startOfLocalWeek(date: string): string {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addLocalDays(date, day === 0 ? -6 : 1 - day);
}

export function latestActionableOccurrence(
  item: CleaningItem,
  today: string,
): string | null {
  const dates = cleaningOccurrenceDates(item, item.startDate, today);
  return [...dates].reverse().find((date) => !item.completedDates.includes(date))
    ?? dates.at(-1)
    ?? null;
}
