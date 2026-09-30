import type { DurableMutationResult } from "@/src/services/storage/durableMutation";
import type { Task } from "@/src/features/tasks/types/task";
import type { Reminder } from "@/src/features/reminders/types/reminder";
import type {
  BrainDumpConversionTarget,
  BrainDumpEntry,
} from "../types/brainDump";

type ConversionActions = {
  beginConversion: (
    id: string,
    target: BrainDumpConversionTarget,
  ) => string | null;
  completeConversion: (
    id: string,
    target: BrainDumpConversionTarget,
    linkedEntityId?: string,
  ) => void;
  createTask: (input: {
    title: string;
    priority: "medium";
    sourceBrainDumpId: string;
  }) => Promise<DurableMutationResult<Task>>;
  createReminder: (input: {
    title: string;
    scheduledAt?: string;
    sourceBrainDumpId: string;
  }) => Promise<DurableMutationResult<Reminder>>;
};

export async function convertBrainDumpEntry(
  entry: BrainDumpEntry,
  target: BrainDumpConversionTarget,
  actions: ConversionActions,
  scheduledAt?: string,
): Promise<boolean> {
  const conversionId = actions.beginConversion(entry.id, target);
  if (!conversionId) {
    throw new Error("This thought already has a different conversion pending.");
  }

  if (target === "task") {
    const result = await actions.createTask({
      title: entry.text,
      priority: "medium",
      sourceBrainDumpId: conversionId,
    });
    actions.completeConversion(entry.id, target, result.value.id);
    return true;
  }

  if (target === "reminder") {
    const result = await actions.createReminder({
      title: entry.text,
      scheduledAt,
      sourceBrainDumpId: conversionId,
    });
    actions.completeConversion(entry.id, target, result.value.id);
    return true;
  }

  actions.completeConversion(entry.id, target);
  return true;
}
