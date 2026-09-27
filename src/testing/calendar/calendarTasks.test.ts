import { getTasksForCalendarDate } from "@/features/calendar/utils/calendarTasks";
import type { Task } from "@/features/tasks/types/task";
import { assertEqual } from "../testUtils";

const baseTask: Task = {
  id: "task",
  title: "Task",
  completed: false,
  priority: "medium",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

export function testCalendarShowsFutureDatedTasks(): void {
  const tasks = getTasksForCalendarDate(
    [
      { ...baseTask, id: "tomorrow", dueDate: "2026-06-04" },
      { ...baseTask, id: "today", dueDate: "2026-06-03" },
    ],
    "2026-06-04",
  );

  assertEqual(tasks.length, 1, "calendar should show tasks for selected date");
  assertEqual(tasks[0]?.id, "tomorrow", "future task should be visible");
}

export function testCalendarHidesDeletedTasks(): void {
  const tasks = getTasksForCalendarDate(
    [{ ...baseTask, id: "deleted", dueDate: "2026-06-04", deletedAt: "now" }],
    "2026-06-04",
  );

  assertEqual(tasks.length, 0, "deleted tasks should stay hidden");
}

export function testCalendarOrdersTimedTasksBeforeUntimedTasks(): void {
  const tasks = getTasksForCalendarDate(
    [
      { ...baseTask, id: "untimed", dueDate: "2026-06-04" },
      { ...baseTask, id: "late", dueDate: "2026-06-04", dueTime: "18:00" },
      { ...baseTask, id: "early", dueDate: "2026-06-04", dueTime: "08:30" },
    ],
    "2026-06-04",
  );

  assertEqual(tasks.map((task) => task.id).join(","), "early,late,untimed", "calendar should order timed work chronologically before untimed work");
}

export function testCalendarReflectsDateMovementAndDeletion(): void {
  const moved = { ...baseTask, id: "moved", dueDate: "2026-06-05" };
  assertEqual(getTasksForCalendarDate([moved], "2026-06-04").length, 0, "moved task should leave its old date");
  assertEqual(getTasksForCalendarDate([moved], "2026-06-05")[0]?.id, "moved", "moved task should appear on its new date");
  assertEqual(getTasksForCalendarDate([{ ...moved, deletedAt: "now" }], "2026-06-05").length, 0, "deleted moved task should disappear");
}
