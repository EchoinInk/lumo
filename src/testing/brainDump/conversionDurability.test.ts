import { convertBrainDumpEntry } from "@/features/brain-dump/services/convertBrainDumpEntry";
import type { BrainDumpEntry } from "@/features/brain-dump/types/brainDump";
import { assertEqual } from "../testUtils";

function makeEntry(): BrainDumpEntry {
  return {
    id: "thought-1",
    text: "Call the dentist",
    status: "open",
    createdAt: "2026-09-27T00:00:00.000Z",
    updatedAt: "2026-09-27T00:00:00.000Z",
  };
}

export async function testInterruptedConversionRetryCreatesExactlyOneDestination(): Promise<void> {
  const entry = makeEntry();
  const destinations = new Map<string, { id: string }>();
  let completionAttempts = 0;
  const actions = {
    beginConversion: () => "brain-dump:thought-1",
    completeConversion: () => {
      completionAttempts += 1;
      if (completionAttempts === 1) throw new Error("simulated source write failure");
    },
    createTask: async (input: { sourceBrainDumpId: string }) => {
      const existing = destinations.get(input.sourceBrainDumpId);
      const task = existing ?? { id: "task-1" };
      destinations.set(input.sourceBrainDumpId, task);
      return { status: "saved" as const, value: task as any };
    },
    createReminder: () => null,
  };

  try {
    await convertBrainDumpEntry(entry, "task", actions as any);
  } catch {
    // The actionable source would still be open with its stable conversion id.
  }
  await convertBrainDumpEntry(entry, "task", actions as any);

  assertEqual(destinations.size, 1, "retry must reuse the durable destination identity");
  assertEqual(completionAttempts, 2, "source completion should be retried after interruption");
}

export async function testDestinationFailureDoesNotCompleteSource(): Promise<void> {
  let completed = false;
  try {
    await convertBrainDumpEntry(makeEntry(), "task", {
      beginConversion: () => "brain-dump:thought-1",
      completeConversion: () => { completed = true; },
      createTask: async () => { throw new Error("simulated destination failure"); },
      createReminder: () => null,
    } as any);
  } catch {
    // Expected failure leaves the source actionable.
  }
  assertEqual(completed, false, "source must not be marked converted before destination save");
}
