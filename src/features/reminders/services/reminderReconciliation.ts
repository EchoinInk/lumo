import type { AppSettings } from "@/src/store/useSettingsStore";
import * as reminderRepository from "./reminderRepository";
import { resolveEffectiveReminderPolicy } from "./reminderPolicy";
import type { NativeNotificationService, PendingReminderNotification } from "./nativeNotificationService";
import type { Reminder, ReminderSettings } from "../types/reminder";

export interface ReminderDeliveryRepository {
  getReminders(): Promise<Reminder[]>;
  recordReminderScheduling(id: string): Promise<Reminder>;
  recordReminderScheduled(id: string, osNotificationId: string): Promise<Reminder>;
  recordReminderDeliveryFailure(id: string, message: string): Promise<Reminder>;
  recordReminderCancelled(id: string): Promise<Reminder>;
}
export interface ReconciliationInput { appSettings: Pick<AppSettings, "notificationsEnabled">; reminderSettings: ReminderSettings; requestPermission: boolean; now?: number }
export interface ReconciliationResult { permission: "granted" | "denied" | "undetermined"; scheduled: number; adopted: number; cancelled: number; failed: number }

export function reminderFingerprint(reminder: Reminder): string { return JSON.stringify([reminder.title, reminder.scheduledAt, reminder.tone]); }
function isDesired(reminder: Reminder, input: ReconciliationInput): boolean {
  return !reminder.archivedAt && !reminder.completedAt && Boolean(reminder.scheduledAt) && Date.parse(reminder.scheduledAt!) > (input.now ?? Date.now()) && resolveEffectiveReminderPolicy(input.appSettings, input.reminderSettings, reminder).enabled;
}

export async function reconcileReminderNotifications(native: NativeNotificationService, input: ReconciliationInput, repository: ReminderDeliveryRepository = reminderRepository): Promise<ReconciliationResult> {
  const reminders = await repository.getReminders();
  const before = await native.getPermissionState();
  const permission = before === "undetermined" && input.requestPermission && reminders.some((reminder) => isDesired(reminder, input)) ? await native.requestPermission() : before;
  const pending = (await native.getPendingRequests()).filter((request) => Boolean(request.reminderId));
  const byReminder = new Map<string, PendingReminderNotification[]>();
  for (const request of pending) byReminder.set(request.reminderId!, [...(byReminder.get(request.reminderId!) ?? []), request]);
  const result: ReconciliationResult = { permission, scheduled: 0, adopted: 0, cancelled: 0, failed: 0 };
  const reminderIds = new Set(reminders.map((reminder) => reminder.id));
  for (const request of pending) {
    if (request.reminderId && !reminderIds.has(request.reminderId)) { await native.cancel(request.identifier); result.cancelled += 1; }
  }
  for (const reminder of reminders) {
    const requests = byReminder.get(reminder.id) ?? [];
    const desired = isDesired(reminder, input);
    if (!desired || permission !== "granted") {
      const ids = new Set(requests.map((request) => request.identifier));
      if (reminder.osNotificationId) ids.add(reminder.osNotificationId);
      for (const identifier of ids) { await native.cancel(identifier); result.cancelled += 1; }
      if (ids.size > 0 || reminder.deliveryState === "cancellation-pending") await repository.recordReminderCancelled(reminder.id);
      if (desired && permission === "denied") { await repository.recordReminderDeliveryFailure(reminder.id, "Notification permission is denied."); result.failed += 1; }
      continue;
    }
    const fingerprint = reminderFingerprint(reminder);
    const matching = requests.filter((request) => request.fingerprint === fingerprint);
    const keep = matching.find((request) => request.identifier === reminder.osNotificationId) ?? matching[0];
    for (const request of requests) {
      if (request.identifier !== keep?.identifier) { await native.cancel(request.identifier); result.cancelled += 1; }
    }
    if (keep) {
      if (reminder.osNotificationId !== keep.identifier || reminder.deliveryState !== "scheduled") { await repository.recordReminderScheduled(reminder.id, keep.identifier); result.adopted += 1; }
      continue;
    }
    try {
      if (reminder.osNotificationId || reminder.deliveryState === "cancellation-pending") await repository.recordReminderCancelled(reminder.id);
      await repository.recordReminderScheduling(reminder.id);
      const identifier = await native.schedule({ reminderId: reminder.id, fingerprint, title: reminder.title, scheduledAt: reminder.scheduledAt! });
      await repository.recordReminderScheduled(reminder.id, identifier);
      result.scheduled += 1;
    } catch (error) {
      await repository.recordReminderDeliveryFailure(reminder.id, error instanceof Error ? error.message : "Notification scheduling failed.");
      result.failed += 1;
    }
  }
  return result;
}
