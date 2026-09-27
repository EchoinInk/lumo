import type { Task } from "@/src/features/tasks/types/task";

export function getTasksForCalendarDate(tasks: Task[], selectedDate: string): Task[] {
  return tasks
    .filter((task) => !task.deletedAt && task.dueDate === selectedDate)
    .sort((left, right) => {
      if (left.dueTime && right.dueTime) {
        const timeOrder = left.dueTime.localeCompare(right.dueTime);
        if (timeOrder !== 0) return timeOrder;
      } else if (left.dueTime) {
        return -1;
      } else if (right.dueTime) {
        return 1;
      }

      return left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id);
    });
}
