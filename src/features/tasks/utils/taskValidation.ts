import {
  addLocalDays,
  isLocalDateKey,
  isWallClockTime,
} from "@/src/utils/dateTime";
import type { CreateTaskInput, Task, UpdateTaskInput } from "../types/task";

export type TaskDateSelection = "today" | "tomorrow" | "custom" | "none";
export type TaskScheduleField = "dueDate" | "dueTime";

export class TaskScheduleValidationError extends Error {
  constructor(
    public readonly field: TaskScheduleField,
    message: string,
  ) {
    super(message);
    this.name = "TaskScheduleValidationError";
  }
}

function normalizeOptionalValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function validateSchedule(
  dueDate: string | undefined,
  dueTime: string | undefined,
  current?: Task,
): void {
  const preservesLegacyDate = dueDate === current?.dueDate;
  const preservesLegacyTime = dueTime === current?.dueTime;

  if (dueDate && !isLocalDateKey(dueDate) && !preservesLegacyDate) {
    throw new TaskScheduleValidationError(
      "dueDate",
      "Use a valid date in YYYY-MM-DD format.",
    );
  }
  if (dueTime && !isWallClockTime(dueTime) && !preservesLegacyTime) {
    throw new TaskScheduleValidationError(
      "dueTime",
      "Use a 24-hour time like 09:30.",
    );
  }
  if (dueTime && !dueDate) {
    const preservesLegacySchedule =
      current?.dueDate === dueDate && current?.dueTime === dueTime;
    if (!preservesLegacySchedule) {
      throw new TaskScheduleValidationError(
        "dueTime",
        "Choose a date before adding a time.",
      );
    }
  }
}

export function normalizeCreateTaskInput(
  input: CreateTaskInput,
): CreateTaskInput {
  const dueDate = normalizeOptionalValue(input.dueDate);
  const dueTime = normalizeOptionalValue(input.dueTime);
  validateSchedule(dueDate, dueTime);
  return { ...input, dueDate, dueTime };
}

export function normalizeUpdateTaskInput(
  input: UpdateTaskInput,
  current: Task,
): UpdateTaskInput {
  const hasDueDate = Object.prototype.hasOwnProperty.call(input, "dueDate");
  const hasDueTime = Object.prototype.hasOwnProperty.call(input, "dueTime");
  const dueDate = hasDueDate
    ? normalizeOptionalValue(input.dueDate)
    : current.dueDate;
  const dueTime = hasDueTime
    ? normalizeOptionalValue(input.dueTime)
    : current.dueTime;

  validateSchedule(dueDate, dueTime, current);

  return {
    ...input,
    ...(hasDueDate ? { dueDate } : {}),
    ...(hasDueTime ? { dueTime } : {}),
  };
}

export function getTaskDateSelection(
  dueDate: string | undefined,
  today: string,
): { selection: TaskDateSelection; customDate: string } {
  if (!dueDate) return { selection: "none", customDate: "" };
  if (dueDate === today) return { selection: "today", customDate: "" };
  if (dueDate === addLocalDays(today, 1)) {
    return { selection: "tomorrow", customDate: "" };
  }
  return { selection: "custom", customDate: dueDate };
}

export function resolveTaskFormSchedule(input: {
  selection: TaskDateSelection;
  customDate: string;
  dueTime: string;
  today: string;
  currentTask?: Task;
}): Pick<CreateTaskInput, "dueDate" | "dueTime"> {
  let dueDate: string | undefined;
  if (input.selection === "today") {
    dueDate = input.today;
  } else if (input.selection === "tomorrow") {
    dueDate = addLocalDays(input.today, 1);
  } else if (input.selection === "custom") {
    dueDate = normalizeOptionalValue(input.customDate);
  }

  const dueTime =
    input.selection === "none"
      ? undefined
      : normalizeOptionalValue(input.dueTime);
  const schedule = {
    dueDate,
    dueTime,
  };
  if (input.currentTask) {
    return normalizeUpdateTaskInput(schedule, input.currentTask);
  }
  const normalized = normalizeCreateTaskInput({
    title: "schedule-validation",
    priority: "medium",
    ...schedule,
  });
  return { dueDate: normalized.dueDate, dueTime: normalized.dueTime };
}
