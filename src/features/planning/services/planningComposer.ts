import type { BrainDumpEntry } from "@/src/features/brain-dump/types/brainDump";
import { getFocusSuggestions } from "@/src/features/dashboard/utils/focusSuggestions";
import type { Reminder } from "@/src/features/reminders/types/reminder";
import type { Task } from "@/src/features/tasks/types/task";
import {
  addLocalDays,
  isLocalDateKey,
  isTimestampInstant,
  toLocalDateKey,
} from "@/src/utils/dateTime";
import type {
  BrainDumpQueueItem,
  CarryOverItem,
  DailyPlanningSummary,
  LowEnergyOption,
  PlanningComposerInput,
  PlanningEffort,
  PlanningEnergyLevel,
  PlanningNextStep,
  PlanningSourceType,
} from "../types/planning";

function isActiveTask(task: Task): boolean {
  return !task.completed && !task.deletedAt;
}

function taskEffort(task: Task): PlanningEffort {
  if (task.energyRequired === "low" || task.priority === "low") {
    return "tiny";
  }
  if (task.energyRequired === "high" || task.priority === "high") {
    return "focused";
  }
  return "easy";
}

function isReminderDueToday(reminder: Reminder, today: string): boolean {
  if (reminder.completedAt || reminder.archivedAt) return false;
  if (!reminder.scheduledAt) return true;
  if (!isTimestampInstant(reminder.scheduledAt)) return false;
  return toLocalDateKey(new Date(reminder.scheduledAt)) <= today;
}

export function getGentleCarryOverItems(
  tasks: Task[],
  today: string = toLocalDateKey(),
): CarryOverItem[] {
  const yesterday = addLocalDays(today, -1);

  return tasks
    .filter(isActiveTask)
    .filter((task) => {
      if (!isLocalDateKey(task.dueDate)) return false;
      return task.dueDate < today || task.dueDate === yesterday;
    })
    .slice(0, 3)
    .map((task) => ({
      id: `carry-${task.id}`,
      label: task.title,
      sourceType: "task" as const,
      sourceId: task.id,
      reason: "Still useful today?",
    }));
}

export function getEveningCarryOverItems(
  tasks: Task[],
  today: string = toLocalDateKey(),
): CarryOverItem[] {
  return tasks
    .filter(isActiveTask)
    .filter(
      (task) =>
        !task.dueDate ||
        (isLocalDateKey(task.dueDate) && task.dueDate <= today),
    )
    .slice(0, 3)
    .map((task) => ({
      id: `evening-${task.id}`,
      label: task.title,
      sourceType: "task" as const,
      sourceId: task.id,
      reason: "Park anything that does not need to come with you.",
    }));
}

export function getBrainDumpReviewQueue(
  entries: BrainDumpEntry[],
): BrainDumpQueueItem[] {
  return entries
    .filter((entry) => entry.status === "open")
    .slice(0, 3)
    .map((entry) => ({
      id: `brain-${entry.id}`,
      label: entry.text,
      sourceId: entry.id,
      reason: "Want to carry this into today?",
    }));
}

export function getLowEnergyOptions(
  input: PlanningComposerInput,
): LowEnergyOption[] {
  const today = input.today ?? toLocalDateKey();
  const options: LowEnergyOption[] = [];

  const tinyTask = input.tasks
    .filter(isActiveTask)
    .find(
      (task) =>
        task.energyRequired === "low" ||
        task.priority === "low" ||
        !task.dueDate ||
        task.dueDate <= today,
    );

  if (tinyTask) {
    options.push({
      id: `low-task-${tinyTask.id}`,
      label: tinyTask.title,
      sourceType: "task",
      sourceId: tinyTask.id,
      effort: "tiny",
      reason: "One tiny task",
    });
  }

  const routineLabel = input.routineLabels[0];
  if (routineLabel) {
    options.push({
      id: `low-routine-${routineLabel}`,
      label: routineLabel,
      sourceType: "routine",
      sourceId: routineLabel,
      effort: "tiny",
      reason: "A gentle reset",
    });
  }

  const reminder = input.reminders.find((item) =>
    isReminderDueToday(item, today),
  );
  if (reminder) {
    options.push({
      id: `low-reminder-${reminder.id}`,
      label: reminder.title,
      sourceType: "reminder",
      sourceId: reminder.id,
      effort: "easy",
      reason: "Optional reminder",
    });
  }

  if (options.length === 0) {
    options.push({
      id: "low-reset-small-reset",
      label: "Take a small reset",
      sourceType: "routine",
      sourceId: "low-energy-reset",
      effort: "tiny",
      reason: "A tiny starting point",
    });
  }

  return options.slice(0, 3);
}

function energyWeight(
  effort: PlanningEffort,
  sourceType: PlanningSourceType,
  energyLevel?: PlanningEnergyLevel,
): number {
  if (energyLevel === "low") {
    const effortWeight = { tiny: 5, easy: 3, focused: 1 };
    const sourceWeight =
      sourceType === "reminder" || sourceType === "routine" ? 2 : 0;
    return effortWeight[effort] + sourceWeight;
  }

  if (energyLevel === "steady") {
    const effortWeight = { tiny: 2, easy: 3, focused: 5 };
    return effortWeight[effort];
  }

  const effortWeight = { tiny: 3, easy: 4, focused: 3 };
  return effortWeight[effort];
}

export function getSuggestedNextSteps(
  input: PlanningComposerInput,
): PlanningNextStep[] {
  const today = input.today ?? toLocalDateKey();
  const steps: PlanningNextStep[] = [];

  const focusSuggestions = getFocusSuggestions(input.tasks, 3, today);
  for (const suggestion of focusSuggestions) {
    steps.push({
      id: `focus-${suggestion.task.id}`,
      label: suggestion.task.title,
      sourceType: "task",
      sourceId: suggestion.task.id,
      effort: taskEffort(suggestion.task),
      reason:
        input.energyLevel === "low"
          ? "Choose one small step."
          : suggestion.reason,
    });
  }

  for (const reminder of input.reminders) {
    if (!isReminderDueToday(reminder, today)) continue;
    steps.push({
      id: `reminder-${reminder.id}`,
      label: reminder.title,
      sourceType: "reminder",
      sourceId: reminder.id,
      effort: "easy",
      reason: "Gentle reminder for today",
    });
  }

  for (const label of input.routineLabels.slice(0, 2)) {
    steps.push({
      id: `routine-${label}`,
      label,
      sourceType: "routine",
      sourceId: label,
      effort: "tiny",
      reason: "Today's routine anchor",
    });
  }

  for (const entry of input.brainDumpEntries.filter(
    (item) => item.status === "open",
  )) {
    steps.push({
      id: `brain-${entry.id}`,
      label: entry.text,
      sourceType: "brainDump",
      sourceId: entry.id,
      effort: "easy",
      reason: "From your Brain Dump",
    });
  }

  const unique = new Map<string, PlanningNextStep>();
  for (const step of steps) {
    if (!unique.has(step.id)) {
      unique.set(step.id, step);
    }
  }

  let ranked = Array.from(unique.values()).sort(
    (a, b) =>
      energyWeight(b.effort, b.sourceType, input.energyLevel) -
      energyWeight(a.effort, a.sourceType, input.energyLevel),
  );

  if (input.energyLevel === "low") {
    ranked = ranked.filter((step) => step.effort !== "focused");
  }

  return ranked.slice(0, 3);
}

export function composeDailyPlanningSummary(
  input: PlanningComposerInput,
  partial: Partial<DailyPlanningSummary> = {},
): DailyPlanningSummary {
  const today = input.today ?? toLocalDateKey();
  const carryOverItems = getGentleCarryOverItems(input.tasks, today);
  const brainDumpQueue = getBrainDumpReviewQueue(input.brainDumpEntries);
  const nextSteps = getSuggestedNextSteps(input);

  return {
    date: today,
    selectedFocusIds: partial.selectedFocusIds ?? nextSteps.map((s) => s.id),
    carryOverIds: partial.carryOverIds ?? carryOverItems.map((i) => i.id),
    brainDumpQueueIds:
      partial.brainDumpQueueIds ?? brainDumpQueue.map((i) => i.id),
    nextStepId: partial.nextStepId ?? nextSteps[0]?.id,
    energyLevel: partial.energyLevel ?? input.energyLevel,
    morningCompleted: partial.morningCompleted ?? false,
    eveningCompleted: partial.eveningCompleted ?? false,
    parkedIds: partial.parkedIds ?? [],
    eveningCarriedIds: partial.eveningCarriedIds ?? [],
    eveningParkedIds: partial.eveningParkedIds ?? [],
    eveningBrainDumpVisited: partial.eveningBrainDumpVisited ?? false,
  };
}
