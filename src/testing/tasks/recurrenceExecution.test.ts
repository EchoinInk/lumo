import { taskLocalRepository } from "@/features/tasks/services/taskLocalRepository";
import { useTaskStore } from "@/features/tasks/store/useTaskStore";
import { deleteKey } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { assert, assertEqual, resetTestState } from "../testUtils";
import { getNextOccurrenceAfter } from "@/features/tasks/utils/recurrence";

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

export function testRecurrenceCoversDailyWeeklyIntervalsAndDstBoundaries(): void {
  assertEqual(
    getNextOccurrenceAfter("2026-03-28", { type: "daily" }, "2026-03-28"),
    "2026-03-29",
    "daily recurrence should use civil days across a DST boundary",
  );
  assertEqual(
    getNextOccurrenceAfter("2026-06-01", { type: "daily", interval: 3 }, "2026-06-01"),
    "2026-06-04",
    "daily intervals should advance by the requested number of days",
  );
  assertEqual(
    getNextOccurrenceAfter("2026-06-01", { type: "weekly" }, "2026-06-01"),
    "2026-06-08",
    "weekly recurrence should advance one week",
  );
  assertEqual(
    getNextOccurrenceAfter("2026-06-01", { type: "weekly", interval: 2 }, "2026-06-01"),
    "2026-06-15",
    "weekly intervals should retain their anchored cadence",
  );
  assertEqual(
    getNextOccurrenceAfter(
      "2026-06-01",
      { type: "weekly", interval: 2, weekdays: ["Wed"] },
      "2026-06-03",
    ),
    "2026-06-17",
    "selected weekdays should respect multi-week intervals",
  );
}

export function testMonthlyRecurrenceKeepsMonthEndAndLeapYearAnchor(): void {
  assertEqual(
    getNextOccurrenceAfter("2026-02-28", { type: "monthly" }, "2026-02-28", "2026-01-31"),
    "2026-03-31",
    "month-end recurrence should return to the anchored day",
  );
  assertEqual(
    getNextOccurrenceAfter("2028-02-29", { type: "monthly" }, "2028-02-29", "2028-01-31"),
    "2028-03-31",
    "leap-year clamping should not lose the month-end anchor",
  );
  assertEqual(
    getNextOccurrenceAfter("2026-01-31", { type: "monthly", interval: 2 }, "2026-01-31"),
    "2026-03-31",
    "monthly intervals should advance from the series anchor",
  );
}

export async function testCompletionCreatesExactlyOneDurableSuccessor(): Promise<void> {
  resetTasks();
  const first = await taskLocalRepository.createTask({
    title: "Repeat me",
    priority: "medium",
    dueDate: "2026-09-20",
    dueTime: "09:30",
    recurrence: { type: "daily" },
  });

  const completed = await taskLocalRepository.setTaskCompletion(
    first.id,
    true,
    "2026-09-27",
  );
  await taskLocalRepository.setTaskCompletion(first.id, true, "2026-09-27");
  const tasks = await taskLocalRepository.getTasks();
  const successor = tasks.find((task) => task.previousOccurrenceId === first.id);

  assertEqual(tasks.length, 2, "repeated completion should create one successor");
  assertEqual(completed.completed, true, "the historical occurrence should stay completed");
  assert(Boolean(completed.completedAt), "completion history should retain its timestamp");
  assertEqual(successor?.dueDate, "2026-09-28", "missed days should collapse to one future occurrence");
  assertEqual(successor?.dueTime, "09:30", "the wall-clock due time should carry forward");
  assertEqual(successor?.seriesId, first.id, "occurrences should share stable series identity");
  assertEqual(successor?.occurrenceIndex, 1, "the next occurrence should advance its index");
}

export async function testUndoEditRecompletionAndRestartStayPredictable(): Promise<void> {
  resetTasks();
  const first = await taskLocalRepository.createTask({
    title: "Original title",
    priority: "low",
    dueDate: "2026-09-27",
    recurrence: { type: "weekly" },
  });
  await taskLocalRepository.setTaskCompletion(first.id, true, "2026-09-27");
  const successor = (await taskLocalRepository.getTasks()).find(
    (task) => task.previousOccurrenceId === first.id,
  );
  if (!successor) throw new Error("completion should create a successor");
  await taskLocalRepository.updateTask(successor.id, { title: "Edited next only" });
  await taskLocalRepository.setTaskCompletion(first.id, false, "2026-09-27");
  await taskLocalRepository.setTaskCompletion(first.id, true, "2026-09-27");

  useTaskStore.setState({ tasks: [], hasHydrated: false });
  await useTaskStore.getState().hydrateTasks();
  const restarted = useTaskStore.getState().tasks;
  assertEqual(restarted.length, 2, "undo and recompletion should not duplicate the successor");
  assertEqual(
    restarted.find((task) => task.id === successor.id)?.title,
    "Edited next only",
    "editing one occurrence should survive undo, recompletion and restart",
  );
  assertEqual(
    restarted.find((task) => task.id === first.id)?.completed,
    true,
    "recompletion should restore the historical completion",
  );
}

export async function testRepeatedCompletionTapsCreateOneSuccessor(): Promise<void> {
  resetTasks();
  const created = await useTaskStore.getState().addTask({
    title: "Tap once",
    priority: "high",
    dueDate: "2099-01-01",
    recurrence: { type: "monthly" },
  });
  const firstTap = useTaskStore.getState().toggleTask(created.value.id);
  const repeatedTap = useTaskStore.getState().toggleTask(created.value.id);
  await Promise.all([firstTap, repeatedTap]);

  const tasks = await taskLocalRepository.getTasks();
  assertEqual(tasks.length, 2, "repeated taps should persist one next occurrence");
  assertEqual(
    tasks.filter((task) => task.previousOccurrenceId === created.value.id).length,
    1,
    "the predecessor link should identify one successor",
  );
}
