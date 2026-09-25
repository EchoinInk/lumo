import type { Task } from "@/src/features/tasks/types/task";
import { isLocalDateKey, toLocalDateKey } from "@/src/utils/dateTime";

export type FocusSuggestionKind =
  | "one_next_step"
  | "low_energy"
  | "quick_win"
  | "later_capacity";

export interface FocusSuggestion {
  task: Task;
  kind: FocusSuggestionKind;
  reason: string;
}

export function getFocusSuggestions(
  tasks: Task[],
  limit = 3,
  today: string = toLocalDateKey(),
): FocusSuggestion[] {
  return tasks
    .filter(
      (task) =>
        !task.completed &&
        !task.deletedAt &&
        (!task.dueDate ||
          (isLocalDateKey(task.dueDate) && task.dueDate <= today)),
    )
    .map((task): FocusSuggestion => {
      const isQuickWin =
        task.priority === "low" || task.energyRequired === "low";
      const isToday = !task.dueDate || task.dueDate <= today;

      if (task.energyRequired === "low") {
        return {
          task,
          kind: "low_energy",
          reason: "Low energy option",
        };
      }

      if (isQuickWin) {
        return {
          task,
          kind: "quick_win",
          reason: "Quick win",
        };
      }

      if (!isToday || task.energyRequired === "high") {
        return {
          task,
          kind: "later_capacity",
          reason: "Later when you have more capacity",
        };
      }

      return {
        task,
        kind: "one_next_step",
        reason: "One next step",
      };
    })
    .sort((a, b) => {
      const weight = {
        low_energy: 4,
        quick_win: 3,
        one_next_step: 2,
        later_capacity: 1,
      };
      return weight[b.kind] - weight[a.kind];
    })
    .slice(0, Math.min(Math.max(limit, 1), 3));
}
