import { taskLocalRepository } from "@/features/tasks/services/taskLocalRepository";
import { useTaskStore } from "@/features/tasks/store/useTaskStore";
import type { Task } from "@/features/tasks/types/task";
import {
  filterTasksByDate,
  type TaskDateFilter,
} from "@/features/tasks/utils/taskHelpers";
import {
  getTaskDateSelection,
  resolveTaskFormSchedule,
} from "@/features/tasks/utils/taskValidation";
import { DurableMutationError } from "@/services/storage/durableMutation";
import { deleteKey, storageInstance } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { assert, assertEqual, resetTestState } from "../testUtils";

function resetTasks(): void {
  resetTestState();
  deleteKey(StorageKeys.TASKS);
  useTaskStore.setState({
    tasks: [],
    hasHydrated: true,
    hydrationError: null,
    mutationError: null,
  });
}

function task(
  id: string,
  dueDate: string | undefined,
  completed = false,
): Task {
  return {
    id,
    title: id,
    completed,
    priority: "medium",
    dueDate,
    createdAt: "2026-09-27T00:00:00.000Z",
    updatedAt: "2026-09-27T00:00:00.000Z",
  };
}

export async function testTaskCreateAndEditRoundTripEverySupportedField(): Promise<void> {
  resetTasks();
  const created = await useTaskStore.getState().addTask({
    title: "Plan launch",
    description: "First draft",
    priority: "low",
    energyRequired: "high",
    recurrence: { type: "weekly", interval: 2, weekdays: ["Tue", "Thu"] },
    dueDate: "2026-11-18",
    dueTime: "09:30",
  });

  await useTaskStore.getState().updateTask(created.value.id, {
    title: "Plan launch carefully",
    description: "Final draft",
    priority: "high",
    energyRequired: "low",
    recurrence: { type: "monthly", interval: 1 },
    dueDate: "2027-02-14",
    dueTime: "21:05",
  });

  useTaskStore.setState({ tasks: [], hasHydrated: false });
  await useTaskStore.getState().hydrateTasks();
  const reloaded = useTaskStore.getState().tasks[0];

  assertEqual(reloaded?.title, "Plan launch carefully", "title should restart");
  assertEqual(reloaded?.description, "Final draft", "description should restart");
  assertEqual(reloaded?.priority, "high", "priority should restart");
  assertEqual(reloaded?.energyRequired, "low", "energy should restart");
  assertEqual(reloaded?.dueDate, "2027-02-14", "arbitrary date should restart");
  assertEqual(reloaded?.dueTime, "21:05", "time should restart");
  assertEqual(reloaded?.recurrence?.type, "monthly", "recurrence should restart");
  assertEqual(
    reloaded?.recurrence?.type === "monthly"
      ? reloaded.recurrence.interval
      : undefined,
    1,
    "recurrence interval should restart",
  );
}

export async function testArbitraryExistingDateSurvivesEditFormRoundTrip(): Promise<void> {
  resetTasks();
  const created = await taskLocalRepository.createTask({
    title: "Keep schedule",
    priority: "medium",
    dueDate: "2028-06-19",
    dueTime: "14:45",
  });
  const dateState = getTaskDateSelection(created.dueDate, "2026-09-27");
  assertEqual(dateState.selection, "custom", "non-preset date should open as custom");
  assertEqual(dateState.customDate, "2028-06-19", "custom date should populate");

  const schedule = resolveTaskFormSchedule({
    ...dateState,
    dueTime: created.dueTime ?? "",
    today: "2026-09-27",
    currentTask: created,
  });
  await taskLocalRepository.updateTask(created.id, {
    title: "Keep schedule after edit",
    ...schedule,
  });

  const stored = await taskLocalRepository.getById(created.id);
  assertEqual(stored?.dueDate, "2028-06-19", "edit should preserve arbitrary date");
  assertEqual(stored?.dueTime, "14:45", "edit should preserve its time");
}

export async function testInvalidTaskTimeAndDateAreRejectedWithoutMutation(): Promise<void> {
  resetTasks();
  for (const input of [
    { dueDate: "2026-10-10", dueTime: "9:30 AM" },
    { dueDate: "2026-02-30", dueTime: "09:30" },
    { dueDate: undefined, dueTime: "09:30" },
  ]) {
    let failure: unknown;
    try {
      await taskLocalRepository.createTask({
        title: "Invalid schedule",
        priority: "medium",
        ...input,
      });
    } catch (error) {
      failure = error;
    }
    assert(
      failure instanceof DurableMutationError &&
        failure.kind === "invalid-input",
      "invalid task schedules should use the durable invalid-input contract",
    );
  }
  assertEqual(
    (await taskLocalRepository.getTasks()).length,
    0,
    "invalid schedules must not be persisted",
  );
}

export async function testFailedCreateRemainsRetryableAndDoesNotEnterMemory(): Promise<void> {
  resetTasks();
  const originalSet = storageInstance.set;
  let failWrite = true;
  storageInstance.set = (key, value) => {
    if (failWrite && key === StorageKeys.TASKS) {
      throw new Error("Injected task create failure");
    }
    originalSet(key, value);
  };

  try {
    let failure: unknown;
    try {
      await useTaskStore.getState().addTask({
        title: "Retry me",
        priority: "medium",
      });
    } catch (error) {
      failure = error;
    }
    assert(failure instanceof DurableMutationError, "failed create should reject");
    assertEqual(
      useTaskStore.getState().tasks.length,
      0,
      "failed create must not appear successful in memory",
    );

    failWrite = false;
    const retry = await useTaskStore.getState().addTask({
      title: "Retry me",
      priority: "medium",
    });
    assertEqual(retry.status, "saved", "retry should report durable success");
    assertEqual(
      (await taskLocalRepository.getTasks())[0]?.title,
      "Retry me",
      "retry should persist the original intent",
    );
  } finally {
    storageInstance.set = originalSet;
  }
}

export function testTaskDateFilterBoundaries(): void {
  const today = "2026-09-27";
  const tasks = [
    task("overdue", "2026-09-26"),
    task("today", today),
    task("upcoming", "2026-09-28"),
    task("undated", undefined),
    task("completed-overdue", "2026-09-25", true),
    task("completed-today", today, true),
    task("completed-future", "2026-10-01", true),
  ];
  const ids = (filter: TaskDateFilter) =>
    filterTasksByDate(tasks, filter, today).map((item) => item.id).join(",");

  assertEqual(
    ids("today"),
    "overdue,today,undated",
    "Today should include active overdue, due-today, and undated tasks",
  );
  assertEqual(
    ids("upcoming"),
    "upcoming",
    "Upcoming should include only active future-dated tasks",
  );
  assertEqual(
    ids("done"),
    "completed-overdue,completed-today,completed-future",
    "Done should ignore date boundaries",
  );
  assertEqual(ids("all"), tasks.map((item) => item.id).join(","), "All should retain every task");
}
