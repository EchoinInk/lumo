import type { BrainDumpEntry } from "@/src/features/brain-dump/types/brainDump";
import type { Reminder } from "@/src/features/reminders/types/reminder";
import type { Task } from "@/src/features/tasks/types/task";
import {
  getBrainDumpReviewQueue,
  getEveningCarryOverItems,
  getGentleCarryOverItems,
  getLowEnergyOptions,
  getSuggestedNextSteps,
} from "@/src/features/planning/services/planningComposer";
import { assertEqual } from "../testUtils";

const baseTask: Task = {
  id: "task",
  title: "Task",
  completed: false,
  priority: "medium",
  createdAt: "2026-05-31T00:00:00.000Z",
  updatedAt: "2026-05-31T00:00:00.000Z",
};

const today = "2026-06-01";
const yesterday = "2026-05-31";

export function testCarryOverItemsCapAtThree(): void {
  const tasks = [1, 2, 3, 4, 5].map((index) => ({
    ...baseTask,
    id: `task-${index}`,
    title: `Task ${index}`,
    dueDate: yesterday,
  }));

  const items = getGentleCarryOverItems(tasks, today);
  assertEqual(items.length, 3, "carry-over suggestions should cap at 3");
}

export function testCarryOverUsesGentleCopy(): void {
  const items = getGentleCarryOverItems(
    [{ ...baseTask, id: "a", dueDate: yesterday }],
    today,
  );

  assertEqual(
    items[0]?.reason,
    "Still useful today?",
    "carry-over should use gentle copy",
  );
}

export function testLowEnergyNextStepsExcludeFocusedTasks(): void {
  const steps = getSuggestedNextSteps({
    tasks: [
      { ...baseTask, id: "focused", title: "Deep work", energyRequired: "high" },
      { ...baseTask, id: "tiny", title: "Tiny task", energyRequired: "low" },
    ],
    reminders: [],
    routineLabels: [],
    brainDumpEntries: [],
    energyLevel: "low",
    today,
  });

  assertEqual(
    steps.every((step) => step.effort !== "focused"),
    true,
    "low energy should avoid focused tasks",
  );
}

export function testEveningCarryOverCapsAtThree(): void {
  const tasks = [1, 2, 3, 4].map((index) => ({
    ...baseTask,
    id: `task-${index}`,
    title: `Task ${index}`,
    dueDate: today,
  }));

  const items = getEveningCarryOverItems(tasks, today);
  assertEqual(items.length, 3, "evening carry-over should cap at 3");
}

export function testBrainDumpReviewQueueCapsAtThree(): void {
  const entries: BrainDumpEntry[] = [1, 2, 3, 4].map((index) => ({
    id: `entry-${index}`,
    text: `Thought ${index}`,
    status: "open",
    createdAt: "2026-05-31T00:00:00.000Z",
    updatedAt: "2026-05-31T00:00:00.000Z",
  }));

  const queue = getBrainDumpReviewQueue(entries);
  assertEqual(queue.length, 3, "brain dump preview should cap at 3");
}

export function testLowEnergyOptionsPreferTinyActions(): void {
  const reminders: Reminder[] = [
    {
      id: "reminder",
      title: "Take meds",
      tone: "gentle",
      enabled: true,
      deliveryState: "not-scheduled",
      version: 1,
      createdAt: "2026-05-31T00:00:00.000Z",
      updatedAt: "2026-05-31T00:00:00.000Z",
    },
  ];

  const options = getLowEnergyOptions({
    tasks: [
      { ...baseTask, id: "tiny", title: "Tiny task", energyRequired: "low" },
      { ...baseTask, id: "big", title: "Big task", energyRequired: "high" },
    ],
    reminders,
    routineLabels: ["Morning reset"],
    brainDumpEntries: [],
    energyLevel: "low",
    today,
  });

  assertEqual(
    options[0]?.effort,
    "tiny",
    "low energy path should prioritize tiny actions",
  );
}

export function testLowEnergyOptionsProvideFallbackWhenEmpty(): void {
  const options = getLowEnergyOptions({
    tasks: [],
    reminders: [],
    routineLabels: [],
    brainDumpEntries: [],
    energyLevel: "low",
    today,
  });

  assertEqual(
    options[0]?.label,
    "Take a small reset",
    "low energy path should always offer one tiny fallback action",
  );
}

export function testNextStepsCapAtThree(): void {
  const steps = getSuggestedNextSteps({
    tasks: [1, 2, 3, 4, 5].map((index) => ({
      ...baseTask,
      id: `task-${index}`,
      title: `Task ${index}`,
    })),
    reminders: [],
    routineLabels: ["Routine A", "Routine B"],
    brainDumpEntries: [],
    energyLevel: "medium",
    today,
  });

  assertEqual(steps.length, 3, "next-step suggestions should cap at 3");
}

export function testLowEnergyNextStepsPreferRemindersAndRoutines(): void {
  const steps = getSuggestedNextSteps({
    tasks: [
      { ...baseTask, id: "focused", title: "Deep work", energyRequired: "high" },
    ],
    reminders: [
      {
        id: "reminder",
        title: "Stretch",
        tone: "gentle",
        enabled: true,
        deliveryState: "not-scheduled",
        version: 1,
        createdAt: "2026-05-31T00:00:00.000Z",
        updatedAt: "2026-05-31T00:00:00.000Z",
      },
    ],
    routineLabels: ["Evening shutdown"],
    brainDumpEntries: [],
    energyLevel: "low",
    today,
  });

  assertEqual(
    steps[0]?.sourceType === "reminder" ||
      steps[0]?.sourceType === "routine" ||
      steps[0]?.effort === "tiny",
    true,
    "low energy should prefer tiny, reminder, or routine options",
  );
}

export function testReminderInstantUsesAucklandLocalDayWithoutUtcSlicing(): void {
  const previousTimeZone = process.env.TZ;
  process.env.TZ = "Pacific/Auckland";
  try {
    const reminder: Reminder = {
      id: "midnight-reminder",
      title: "After midnight",
      scheduledAt: "2026-01-01T11:30:00.000Z",
      tone: "gentle",
      enabled: true,
      deliveryState: "not-scheduled",
      version: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const beforeLocalDay = getLowEnergyOptions({
      tasks: [],
      reminders: [reminder],
      routineLabels: [],
      brainDumpEntries: [],
      today: "2026-01-01",
    });
    const onLocalDay = getLowEnergyOptions({
      tasks: [],
      reminders: [reminder],
      routineLabels: [],
      brainDumpEntries: [],
      today: "2026-01-02",
    });

    assertEqual(
      beforeLocalDay[0]?.id,
      "low-reset-small-reset",
      "a UTC January 1 instant on Auckland January 2 should not be due early",
    );
    assertEqual(
      onLocalDay[0]?.id,
      "low-reminder-midnight-reminder",
      "the reminder should become due on its Auckland local day",
    );
  } finally {
    if (previousTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimeZone;
  }
}
