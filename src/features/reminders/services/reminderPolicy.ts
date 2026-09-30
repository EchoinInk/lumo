import type { AppSettings } from "@/src/store/useSettingsStore";
import type { Reminder, ReminderSettings } from "../types/reminder";

export type EffectiveReminderPolicyReason =
  | "enabled"
  | "app-notifications-disabled"
  | "reminders-disabled"
  | "reminder-disabled";

export interface EffectiveReminderPolicy {
  enabled: boolean;
  reason: EffectiveReminderPolicyReason;
}

export function resolveEffectiveReminderPolicy(
  appSettings: Pick<AppSettings, "notificationsEnabled">,
  reminderSettings: Pick<ReminderSettings, "remindersEnabled">,
  reminder?: Pick<Reminder, "enabled">,
): EffectiveReminderPolicy {
  if (!appSettings.notificationsEnabled) {
    return { enabled: false, reason: "app-notifications-disabled" };
  }
  if (!reminderSettings.remindersEnabled) {
    return { enabled: false, reason: "reminders-disabled" };
  }
  if (reminder && !reminder.enabled) {
    return { enabled: false, reason: "reminder-disabled" };
  }
  return { enabled: true, reason: "enabled" };
}
