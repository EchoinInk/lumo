import {
  createReminder,
  deleteReminder,
  getReminders,
  recordReminderCancelled,
  recordReminderScheduling,
  recordReminderScheduled,
  setReminderCompleted,
  updateReminder,
} from "@/features/reminders/services/reminderRepository";
import { DurableMutationError } from "@/services/storage/durableMutation";
import { assert, assertEqual, resetTestState } from "../testUtils";

const future = "2099-06-03T10:15:00.000Z";

export async function testReminderLifecycleCreateEditCompleteDeletePersists(): Promise<void> {
  resetTestState();
  const created = await createReminder({ title: "  Call Mum  ", scheduledAt: future, tone: "gentle" });
  assertEqual(created.title, "Call Mum", "create should trim the title");
  assertEqual(created.deliveryState, "not-scheduled", "a local save must not claim OS scheduling");

  const edited = await updateReminder(created.id, { title: "Call Dad", scheduledAt: future, enabled: false, tone: "practical" });
  assertEqual(edited.title, "Call Dad", "edit should replace mutable fields");
  assertEqual(edited.enabled, false, "edit should persist per-reminder enablement");

  const completed = await setReminderCompleted(created.id, true);
  assert(Boolean(completed.completedAt), "complete should persist a completion timestamp");
  const reopened = await setReminderCompleted(created.id, false);
  assertEqual(reopened.completedAt, undefined, "reopen should clear completion");

  await deleteReminder(created.id);
  const restarted = await getReminders();
  assert(Boolean(restarted[0]?.archivedAt), "delete tombstone should survive a repository reload");
}

export async function testReminderRejectsInvalidAndPastSchedules(): Promise<void> {
  resetTestState();
  for (const scheduledAt of ["not-a-time", "2020-01-01T00:00:00.000Z"]) {
    try {
      await createReminder({ title: "Invalid schedule", scheduledAt });
      throw new Error("invalid schedule should have been rejected");
    } catch (error) {
      assert(error instanceof DurableMutationError && error.kind === "invalid-input", "invalid/past schedules should be classified as invalid input");
    }
  }
  assertEqual((await getReminders()).length, 0, "rejected schedules must not be persisted");
}

export async function testReminderSourceReferenceMakesDuplicateSavesIdempotent(): Promise<void> {
  resetTestState();
  const input = { title: "Converted thought", sourceBrainDumpId: "conversion-123" };
  const [first, second] = await Promise.all([createReminder(input), createReminder(input)]);
  assertEqual(second.id, first.id, "the stable source reference should resolve duplicate saves to one reminder");
  const restarted = await getReminders();
  assertEqual(restarted.length, 1, "only one destination should persist");
  assertEqual(restarted[0]?.sourceRef?.id, "conversion-123", "source identity should survive source deletion or restart");
}

export async function testReminderOsIdentifierAndCancellationStateSurviveRestart(): Promise<void> {
  resetTestState();
  const created = await createReminder({ title: "Appointment", scheduledAt: future });
  const scheduling = await recordReminderScheduling(created.id);
  assertEqual(scheduling.deliveryState, "scheduling", "an in-flight OS request should be explicit and restart-safe");
  const scheduled = await recordReminderScheduled(created.id, "os-request-42");
  assertEqual(scheduled.deliveryState, "scheduled", "OS acceptance should be explicit");
  assertEqual(scheduled.osNotificationId, "os-request-42", "OS identifier should be stored");

  const completed = await setReminderCompleted(created.id, true);
  assertEqual(completed.deliveryState, "cancellation-pending", "completion with an OS request should require cancellation");
  assertEqual(completed.osNotificationId, "os-request-42", "identifier must remain until cancellation succeeds");

  const restarted = (await getReminders())[0];
  assertEqual(restarted?.deliveryState, "cancellation-pending", "cancellation state should survive restart");
  await recordReminderCancelled(created.id);
  const cancelled = (await getReminders())[0];
  assertEqual(cancelled?.osNotificationId, undefined, "confirmed cancellation should clear the OS identifier");
  assertEqual(cancelled?.deliveryState, "not-scheduled", "confirmed cancellation should not claim delivery");
}
