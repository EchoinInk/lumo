import * as habitRepository from "@/features/habits/services/habitLocalRepository";
import { useHabitStore } from "@/features/habits/store/useHabitStore";
import { taskLocalRepository } from "@/features/tasks/services/taskLocalRepository";
import { useTaskStore } from "@/features/tasks/store/useTaskStore";
import {
  DurableMutationError,
  MutationSubmissionGuard,
} from "@/services/storage/durableMutation";
import { deleteKey, storageInstance } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { assert, assertEqual, resetTestState } from "../testUtils";

function resetDurableState(): void {
  resetTestState();
  deleteKey(StorageKeys.TASKS);
  deleteKey(StorageKeys.HABITS);
  useTaskStore.setState({
    tasks: [],
    hasHydrated: true,
    hydrationError: null,
    mutationError: null,
  });
  useHabitStore.setState({
    habits: [],
    isHydrated: true,
    isLoading: false,
    error: null,
  });
}

const dailyHabit = (title: string) => ({
  title,
  frequency: "daily" as const,
  color: "blue" as const,
});

export async function testConcurrentHabitCreatesRetainEveryRecord(): Promise<void> {
  resetDurableState();

  await Promise.all([
    habitRepository.createHabit(dailyHabit("First")),
    habitRepository.createHabit(dailyHabit("Second")),
  ]);

  const habits = await habitRepository.getHabits();
  assertEqual(habits.length, 2, "concurrent creates should retain both habits");
  assert(
    habits.some((habit) => habit.title === "First") &&
      habits.some((habit) => habit.title === "Second"),
    "both concurrently created records should remain readable",
  );
}

export async function testConcurrentTaskEditsMergeAgainstLatestRecord(): Promise<void> {
  resetDurableState();
  const task = await taskLocalRepository.createTask({
    title: "Original",
    priority: "medium",
  });

  await Promise.all([
    taskLocalRepository.updateTask(task.id, { title: "Renamed" }),
    taskLocalRepository.updateTask(task.id, { priority: "high" }),
  ]);

  const stored = await taskLocalRepository.getById(task.id);
  assertEqual(stored?.title, "Renamed", "the first edit should be retained");
  assertEqual(stored?.priority, "high", "the overlapping edit should be retained");
}

export async function testSimultaneousHabitCompletionsRetainBothDates(): Promise<void> {
  resetDurableState();
  const habit = await habitRepository.createHabit(dailyHabit("Hydrate"));

  await Promise.all([
    habitRepository.completeHabit(habit.id, "2026-09-24"),
    habitRepository.completeHabit(habit.id, "2026-09-25"),
  ]);

  const stored = await habitRepository.getHabitById(habit.id);
  assertEqual(stored?.completedDates.length, 2, "both completion writes should remain");
  assert(
    stored?.completedDates.includes("2026-09-24") === true &&
      stored.completedDates.includes("2026-09-25"),
    "both completion dates should be persisted",
  );
}

export async function testDeleteWinsOverQueuedTaskUpdate(): Promise<void> {
  resetDurableState();
  const task = await taskLocalRepository.createTask({
    title: "Delete me",
    priority: "medium",
  });

  const [, update] = await Promise.allSettled([
    taskLocalRepository.deleteTask(task.id),
    taskLocalRepository.updateTask(task.id, { title: "Too late" }),
  ]);

  assertEqual(update.status, "rejected", "an update queued after delete should fail");
  if (update.status === "rejected") {
    assert(
      update.reason instanceof DurableMutationError &&
        update.reason.kind === "conflict",
      "delete/update conflict should use the shared conflict error contract",
    );
  }
  assertEqual(
    (await taskLocalRepository.getTasks()).length,
    0,
    "a conflicting update must not resurrect a deleted task",
  );
}

export async function testFailedWriteRollsBackRetriesAndSurvivesRestart(): Promise<void> {
  resetDurableState();
  const created = await useTaskStore.getState().addTask({
    title: "Durable title",
    priority: "medium",
  });
  const originalSet = storageInstance.set;
  let injectFailure = true;
  storageInstance.set = (key, value) => {
    if (injectFailure && key === StorageKeys.TASKS) {
      throw new Error("Injected write failure");
    }
    originalSet(key, value);
  };

  try {
    let failure: unknown;
    try {
      await useTaskStore
        .getState()
        .updateTask(created.value.id, { title: "Unsaved title" });
    } catch (error) {
      failure = error;
    }

    assert(
      failure instanceof DurableMutationError,
      "write failures should reject through the shared mutation error contract",
    );
    assertEqual(
      useTaskStore.getState().tasks[0]?.title,
      "Durable title",
      "memory should remain at the last durable value after failure",
    );

    useTaskStore.setState({ tasks: [], hasHydrated: false });
    await useTaskStore.getState().hydrateTasks();
    assertEqual(
      useTaskStore.getState().tasks[0]?.title,
      "Durable title",
      "restart after failure should load the last durable value",
    );

    injectFailure = false;
    const retry = await useTaskStore
      .getState()
      .updateTask(created.value.id, { title: "Saved on retry" });
    assertEqual(retry.status, "saved", "a retry should return durable success");
    assertEqual(
      (await taskLocalRepository.getById(created.value.id))?.title,
      "Saved on retry",
      "retry should persist the intended update",
    );
  } finally {
    storageInstance.set = originalSet;
  }
}

export async function testDuplicateToggleAndSubmissionAreSuppressed(): Promise<void> {
  resetDurableState();
  const created = await useTaskStore.getState().addTask({
    title: "Tap once",
    priority: "low",
  });

  const firstToggle = useTaskStore.getState().toggleTask(created.value.id);
  const duplicateToggle = useTaskStore.getState().toggleTask(created.value.id);
  await Promise.all([firstToggle, duplicateToggle]);

  const stored = await taskLocalRepository.getById(created.value.id);
  assertEqual(stored?.completed, true, "duplicate taps should apply one toggle");
  assertEqual(stored?.version, 2, "duplicate taps should produce one stored mutation");

  const guard = new MutationSubmissionGuard();
  assertEqual(guard.begin(), true, "the first form submission should begin");
  assertEqual(guard.begin(), false, "a duplicate submission should be rejected");
  guard.end();
  assertEqual(guard.begin(), true, "submission should be retryable after completion");
}
