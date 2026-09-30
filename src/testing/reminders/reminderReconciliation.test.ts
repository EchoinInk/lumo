import { createReminder, deleteReminder, getReminders, recordReminderScheduling, updateReminder } from "@/features/reminders/services/reminderRepository";
import { reconcileReminderNotifications, reminderFingerprint } from "@/features/reminders/services/reminderReconciliation";
import { defaultReminderSettings } from "@/features/reminders/services/reminderStorage";
import type { NativeNotificationService, NativeReminderScheduleInput, NotificationPermissionState, PendingReminderNotification } from "@/features/reminders/services/nativeNotificationService";
import { assert, assertEqual, resetTestState } from "../testUtils";

const firstTime = "2099-06-03T10:15:00.000Z";
const secondTime = "2099-06-04T11:30:00.000Z";
const settings = { notificationsEnabled: true };

class FakeNativeNotifications implements NativeNotificationService {
  permission: NotificationPermissionState = "granted";
  requestedPermission: NotificationPermissionState = "granted";
  pending: PendingReminderNotification[] = [];
  scheduledInputs: NativeReminderScheduleInput[] = [];
  cancelled: string[] = [];
  requestCount = 0;
  scheduleError?: Error;

  async getPermissionState() { return this.permission; }
  async requestPermission() { this.requestCount += 1; this.permission = this.requestedPermission; return this.permission; }
  async getPendingRequests() { return [...this.pending]; }
  async schedule(input: NativeReminderScheduleInput) {
    if (this.scheduleError) throw this.scheduleError;
    this.scheduledInputs.push(input);
    const identifier = `os-${this.scheduledInputs.length}`;
    this.pending.push({ identifier, reminderId: input.reminderId, fingerprint: input.fingerprint });
    return identifier;
  }
  async cancel(identifier: string) {
    this.cancelled.push(identifier);
    this.pending = this.pending.filter((request) => request.identifier !== identifier);
  }
}

function reconcile(native: FakeNativeNotifications, requestPermission = false) {
  return reconcileReminderNotifications(native, { appSettings: settings, reminderSettings: defaultReminderSettings, requestPermission, now: Date.parse("2099-01-01T00:00:00.000Z") });
}

export async function testPermissionIsRequestedOnlyFromContextualReconciliation(): Promise<void> {
  resetTestState();
  await createReminder({ title: "Contextual", scheduledAt: firstTime });
  const native = new FakeNativeNotifications();
  native.permission = "undetermined";
  await reconcile(native, false);
  assertEqual(native.requestCount, 0, "restart reconciliation must not prompt for permission");
  assertEqual(native.scheduledInputs.length, 0, "an undetermined permission must not claim scheduling");
  await reconcile(native, true);
  assertEqual(native.requestCount, 1, "a user scheduling action may request permission");
  assertEqual((await getReminders())[0].deliveryState, "scheduled", "OS acceptance should be persisted after the contextual prompt");
}

export async function testDuplicateAndInterruptedRequestsAreAdoptedIdempotently(): Promise<void> {
  resetTestState();
  const reminder = await createReminder({ title: "Adopt me", scheduledAt: firstTime });
  await recordReminderScheduling(reminder.id);
  const fingerprint = reminderFingerprint(reminder);
  const native = new FakeNativeNotifications();
  native.pending = [
    { identifier: "interrupted-1", reminderId: reminder.id, fingerprint },
    { identifier: "duplicate-2", reminderId: reminder.id, fingerprint },
  ];
  const first = await reconcile(native);
  assertEqual(first.adopted, 1, "an accepted request left by an interrupted run should be adopted");
  assertEqual(native.pending.length, 1, "duplicate OS requests should be reduced to one");
  assertEqual((await getReminders())[0].osNotificationId, "interrupted-1", "the kept OS identifier should be persisted");
  const second = await reconcile(native);
  assertEqual(second.scheduled + second.adopted + second.cancelled, 0, "repeated reconciliation should make no further OS changes");
  assertEqual(native.pending.length, 1, "idempotent reconciliation should retain one intended request");
}

export async function testEditReschedulesAndDeleteCancelsWithoutStaleRequests(): Promise<void> {
  resetTestState();
  const reminder = await createReminder({ title: "Original", scheduledAt: firstTime });
  const native = new FakeNativeNotifications();
  await reconcile(native);
  const originalId = (await getReminders())[0].osNotificationId;
  await updateReminder(reminder.id, { title: "Changed", scheduledAt: secondTime, enabled: true, tone: "practical" });
  await reconcile(native);
  const updated = (await getReminders())[0];
  assert(originalId !== updated.osNotificationId, "an edit should replace the accepted OS request");
  assert(native.cancelled.includes(originalId!), "the prior OS request should be cancelled");
  assertEqual(native.pending.length, 1, "rescheduling should leave exactly one current request");
  await deleteReminder(reminder.id);
  await reconcile(native);
  assertEqual(native.pending.length, 0, "deletion should remove the pending OS request");
  const archived = (await getReminders())[0];
  assert(Boolean(archived.archivedAt), "canonical deletion tombstone should remain");
  assertEqual(archived.osNotificationId, undefined, "confirmed OS cancellation should clear the persisted identifier");
}

export async function testDeniedPermissionAndAdapterFailureRemainTruthful(): Promise<void> {
  resetTestState();
  await createReminder({ title: "Denied", scheduledAt: firstTime });
  const denied = new FakeNativeNotifications();
  denied.permission = "denied";
  await reconcile(denied, true);
  let stored = (await getReminders())[0];
  assertEqual(stored.deliveryState, "failed", "denied permission should be an explicit failed state");
  assertEqual(stored.osNotificationId, undefined, "denied permission must not invent an OS identifier");
  assertEqual(denied.requestCount, 0, "a denied permission should not be prompted repeatedly");

  resetTestState();
  await createReminder({ title: "Failure", scheduledAt: firstTime });
  const failing = new FakeNativeNotifications();
  failing.scheduleError = new Error("native rejected request");
  await reconcile(failing);
  stored = (await getReminders())[0];
  assertEqual(stored.deliveryState, "failed", "adapter rejection should be persisted as failure");
  assertEqual(stored.deliveryError, "native rejected request", "the boundary failure should remain diagnosable");
  assertEqual(stored.osNotificationId, undefined, "failure before OS acceptance must not report scheduled success");
}

export async function testDisabledPolicyCancelsExistingRequests(): Promise<void> {
  resetTestState();
  await createReminder({ title: "Global off", scheduledAt: firstTime });
  const native = new FakeNativeNotifications();
  await reconcile(native);
  await reconcileReminderNotifications(native, {
    appSettings: { notificationsEnabled: false },
    reminderSettings: defaultReminderSettings,
    requestPermission: false,
    now: Date.parse("2099-01-01T00:00:00.000Z"),
  });
  assertEqual(native.pending.length, 0, "effective notification policy should cancel pending requests");
  assertEqual((await getReminders())[0].deliveryState, "not-scheduled", "confirmed policy cancellation should be persisted truthfully");
}
