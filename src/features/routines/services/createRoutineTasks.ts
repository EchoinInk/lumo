import type { CreateTaskInput } from "@/src/features/tasks/types/task";
import type { RoutineBundle } from "../types/routineBundle";

export function createTasksFromBundle(bundle: RoutineBundle): CreateTaskInput[] {
  const items = bundle.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.title.trim().length > 0);
  if (items.length === 0) {
    throw new Error("Choose at least one routine step before using this bundle.");
  }
  return items.map(({ item, index }) => ({
    title: item.title.trim(),
    description: item.description,
    priority: "low",
    energyRequired: "low",
    sourceOperationId: routineBundleTaskOperationId(bundle.id, index),
  }));
}

export function routineBundleTaskOperationId(
  bundleId: string,
  itemIndex: number,
): string {
  return `routine-bundle:${bundleId}:item:${itemIndex}`;
}
