import { taskLocalRepository } from "@/features/tasks/services/taskLocalRepository";
import { useTaskStore } from "@/features/tasks/store/useTaskStore";
import type { Task } from "@/features/tasks/types/task";
import { deleteKey } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { assertEqual, resetTestState } from "../testUtils";

function makeTask(id: string, title: string): Task {
  const now = new Date().toISOString();
  return {
    id,
    title,
    completed: false,
    priority: "medium",
    createdAt: now,
    updatedAt: now,
    version: 1,
    pendingSync: false,
    syncStatus: "synced",
  };
}

export async function testPersistVisibleTasksPreservesStoreIds(): Promise<void> {
  resetTestState();
  deleteKey(StorageKeys.TASKS);
  useTaskStore.setState({ tasks: [], hasHydrated: false });

  const task = makeTask("task-a", "Write notes");
  useTaskStore.setState({ tasks: [task] });

  await taskLocalRepository.persistVisibleTasks([task]);

  const stored = await taskLocalRepository.getTasks();
  assertEqual(stored.length, 1, "visible tasks should persist once");
  assertEqual(stored[0]?.id, "task-a", "persisted task should keep store id");
  assertEqual(stored[0]?.title, "Write notes", "persisted task should keep title");
}

export async function testPersistVisibleTasksSoftDeletesRemovedTasks(): Promise<void> {
  resetTestState();
  deleteKey(StorageKeys.TASKS);

  const keep = makeTask("keep", "Keep me");
  const remove = makeTask("remove", "Remove me");
  await taskLocalRepository.persistVisibleTasks([keep, remove]);

  await taskLocalRepository.persistVisibleTasks([keep]);

  const stored = await taskLocalRepository.getAllTasksIncludingDeleted();
  assertEqual(stored.length, 2, "soft-deleted tasks remain in storage");
  assertEqual(
    Boolean(stored.find((task) => task.id === "remove")?.deletedAt),
    true,
    "removed visible task should have deletedAt",
  );
  assertEqual(
    stored.find((task) => task.id === "keep")?.deletedAt,
    undefined,
    "kept visible task should stay active",
  );
}

export async function testTaskStoreHydratesEmptyForNewUser(): Promise<void> {
  resetTestState();
  deleteKey(StorageKeys.TASKS);
  useTaskStore.setState({ tasks: [], hasHydrated: false });

  await useTaskStore.getState().hydrateTasks();

  assertEqual(
    useTaskStore.getState().tasks.length,
    0,
    "new users should start without demonstration tasks",
  );
  assertEqual(
    useTaskStore.getState().hasHydrated,
    true,
    "empty task state should finish hydrating",
  );
}

export async function testTaskStoreAddTaskPersistsSameId(): Promise<void> {
  resetTestState();
  deleteKey(StorageKeys.TASKS);
  useTaskStore.setState({ tasks: [], hasHydrated: true });

  const created = await useTaskStore.getState().addTask({
    title: "Quick task",
    priority: "low",
  });

  const stored = await taskLocalRepository.getTasks();
  assertEqual(stored.length, 1, "addTask should persist one task");
  assertEqual(stored[0]?.id, created.value.id, "store and MMKV ids should match");
}

export async function testExistingTaskDateAndTimeRemainUnchanged(): Promise<void> {
  resetTestState();
  deleteKey(StorageKeys.TASKS);
  const task = {
    ...makeTask("dated", "Keep date"),
    dueDate: "2026-12-31",
    dueTime: "09:30",
  };

  await taskLocalRepository.persistVisibleTasks([task]);
  const stored = await taskLocalRepository.getTasks();

  assertEqual(stored[0]?.dueDate, "2026-12-31", "valid date key should survive storage");
  assertEqual(stored[0]?.dueTime, "09:30", "wall-clock time should survive storage");
}
