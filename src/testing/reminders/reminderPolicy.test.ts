import { resolveEffectiveReminderPolicy } from "@/features/reminders/services/reminderPolicy";
import { assertEqual } from "../testUtils";

export function testEffectiveReminderPolicyRequiresBothPreferences(): void {
  assertEqual(resolveEffectiveReminderPolicy({ notificationsEnabled: true }, { remindersEnabled: true }).reason, "enabled", "both preferences should enable reminder delivery");
  assertEqual(resolveEffectiveReminderPolicy({ notificationsEnabled: false }, { remindersEnabled: true }).reason, "app-notifications-disabled", "the general preference should take precedence");
  assertEqual(resolveEffectiveReminderPolicy({ notificationsEnabled: true }, { remindersEnabled: false }).reason, "reminders-disabled", "the reminder preference should disable delivery");
  assertEqual(resolveEffectiveReminderPolicy({ notificationsEnabled: true }, { remindersEnabled: true }, { enabled: false }).reason, "reminder-disabled", "a disabled reminder should not be delivered");
}
