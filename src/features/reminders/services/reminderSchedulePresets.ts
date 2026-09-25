import {
  addLocalDays,
  localDateKeyToDate,
  toLocalDateKey,
  toTimestampInstant,
  weekdayIndexForLocalDate,
} from "@/src/utils/dateTime";

export type ReminderScheduleOptionId =
  | "later_today"
  | "tomorrow"
  | "weekend"
  | "none";

export interface ReminderScheduleOption {
  id: ReminderScheduleOptionId;
  label: string;
  accessibilityLabel: string;
}

export const reminderScheduleOptions: ReminderScheduleOption[] = [
  {
    id: "later_today",
    label: "Later today",
    accessibilityLabel: "Remind me later today",
  },
  {
    id: "tomorrow",
    label: "Tomorrow",
    accessibilityLabel: "Remind me tomorrow",
  },
  {
    id: "weekend",
    label: "This weekend",
    accessibilityLabel: "Remind me this weekend",
  },
  {
    id: "none",
    label: "No time",
    accessibilityLabel: "Save reminder without a time",
  },
];

export function getReminderScheduledAt(
  optionId: ReminderScheduleOptionId,
  now = new Date(),
): string | undefined {
  if (optionId === "none") return undefined;

  if (optionId === "later_today") {
    const laterToday = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    laterToday.setMinutes(0, 0, 0);
    return toTimestampInstant(laterToday);
  }

  const today = toLocalDateKey(now);
  if (optionId === "tomorrow") {
    const tomorrow = addLocalDays(today, 1);
    return toTimestampInstant(localDateKeyToDate(tomorrow, "09:00"));
  }

  const daysUntilSaturday = (6 - weekdayIndexForLocalDate(today) + 7) % 7 || 7;
  const weekend = addLocalDays(today, daysUntilSaturday);
  return toTimestampInstant(localDateKeyToDate(weekend, "10:00"));
}
