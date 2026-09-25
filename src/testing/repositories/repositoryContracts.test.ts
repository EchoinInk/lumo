import { HabitRepository } from "@/services/habitRepository";
import { TaskRepository } from "@/services/taskRepository";
import { deleteKey } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { isErr, isOk } from "@/types/result";
import { assert, assertEqual, createMockRepository } from "../testUtils";

export async function testTaskRepositoryCreateReturnsLocalFirstTask(): Promise<void> {
  deleteKey(StorageKeys.TASKS);
  const repository = new TaskRepository();

  const result = await repository.create({
    title: "Test task",
    completed: false,
    priority: "medium",
    version: 0,
  });

  assert(isOk(result), "task create should return ok result");
  assert(Boolean(result.data?.id), "created task should have an id");
  assertEqual(result.data?.version, 1, "created task should start at version 1");
  assertEqual(
    result.data?.pendingSync,
    true,
    "created task should be marked pending sync",
  );
}

export async function testTaskRepositorySafeFallbacks(): Promise<void> {
  deleteKey(StorageKeys.TASKS);
  const repository = new TaskRepository();

  assertEqual(
    (await repository.getAll()).data?.length,
    0,
    "task getAll should default to empty list",
  );
  assertEqual(
    (await repository.getById("missing")).data,
    null,
    "task getById should default to null",
  );
  assertEqual(
    (await repository.delete("missing")).data,
    true,
    "task delete should be idempotent",
  );

  const updateResult = await repository.update("missing", { completed: true });
  assert(isErr(updateResult), "missing canonical update should return err, not throw");
}

export async function testHabitRepositoryCreateReturnsLocalFirstHabit(): Promise<void> {
  deleteKey(StorageKeys.HABITS);
  const repository = new HabitRepository();

  const result = await repository.create({
    title: "Drink water",
    frequency: "daily",
    targetDays: ["Mon", "Tue", "Wed"],
  });

  assert(isOk(result), "habit create should return ok result");
  assertEqual(
    result.data?.completedDates.length,
    0,
    "created habit should start with no completions",
  );
  assertEqual(
    result.data?.syncStatus,
    "pending",
    "created habit should use the canonical pending sync status",
  );
}

export async function testMockRepositoryContractCoversCrud(): Promise<void> {
  const repository = createMockRepository<{ id: string; value: number }>();

  assert(isOk(await repository.create({ id: "one", value: 1 })), "create ok");
  assertEqual(
    (await repository.getAll()).data?.length,
    1,
    "mock repository should list created records",
  );
  assertEqual(
    (await repository.update("one", { value: 2 })).data?.value,
    2,
    "mock repository should update records",
  );
  assertEqual(
    (await repository.delete("one")).data,
    true,
    "mock repository should delete idempotently",
  );
}
