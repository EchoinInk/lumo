import { starterRoutineBundles } from "@/features/routines";
import { createTasksFromBundle } from "@/features/routines/services/createRoutineTasks";
import { taskLocalRepository } from "@/features/tasks/services/taskLocalRepository";
import { assertEqual, resetTestState } from "../testUtils";

export function testStarterRoutineBundlesProvideExpandedOptions(): void {
  assertEqual(
    starterRoutineBundles.length > 3,
    true,
    "routine bundles should offer more than three options",
  );
}

export function testEmptyEditedRoutineBundleIsRejected(): void {
  try {
    createTasksFromBundle({
      id: "empty",
      title: "Empty",
      description: "",
      items: [{ title: "   " }],
    });
    throw new Error("empty bundle should have been rejected");
  } catch (error) {
    assertEqual(
      error instanceof Error && error.message.includes("at least one"),
      true,
      "empty bundles should not report false success",
    );
  }
}

export async function testRoutineBundleRetryIsIdempotentAcrossRestart(): Promise<void> {
  resetTestState();
  await taskLocalRepository.clearAll();
  const bundle = {
    id: "retryable",
    title: "Retryable",
    description: "",
    items: [{ title: "First" }, { title: "Second" }],
  };
  const inputs = createTasksFromBundle(bundle);

  await taskLocalRepository.createTask(inputs[0]);
  for (const input of inputs) {
    await taskLocalRepository.createTask(input);
  }
  const tasks = await taskLocalRepository.getTasks();

  assertEqual(tasks.length, 2, "retry after a partial bundle must create each task once");
}
