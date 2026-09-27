import { Task, TaskPriority, TaskFilter } from '../types/task';
import { isLocalDateKey, toLocalDateKey } from '@/src/utils/dateTime';

export type TaskDateFilter = "all" | "today" | "upcoming" | "done";

/**
 * Task Utility Helpers
 * 
 * Pure utility functions for task operations.
 * No side effects, no state, no async operations.
 */

/**
 * Group tasks by completion status
 */
export function groupTasksByCompletion(tasks: Task[]) {
  return {
    completed: tasks.filter((task) => task.completed),
    active: tasks.filter((task) => !task.completed),
  };
}

/**
 * Group tasks by priority
 */
export function groupTasksByPriority(tasks: Task[]) {
  return {
    high: tasks.filter((task) => task.priority === 'high'),
    medium: tasks.filter((task) => task.priority === 'medium'),
    low: tasks.filter((task) => task.priority === 'low'),
  };
}

/**
 * Group tasks by due date
 */
export function groupTasksByDueDate(tasks: Task[], today = toLocalDateKey()) {
  
  return {
    overdue: tasks.filter((task) => isLocalDateKey(task.dueDate) && task.dueDate < today && !task.completed),
    today: tasks.filter((task) => task.dueDate === today),
    upcoming: tasks.filter((task) => isLocalDateKey(task.dueDate) && task.dueDate > today),
    noDate: tasks.filter((task) => !task.dueDate),
  };
}

/**
 * Check if a task is overdue
 */
export function isTaskOverdue(task: Task, today = toLocalDateKey()): boolean {
  if (!isLocalDateKey(task.dueDate) || task.completed) {
    return false;
  }
  return task.dueDate < today;
}

/**
 * Check if a task is due today
 */
export function isTaskDueToday(task: Task, today = toLocalDateKey()): boolean {
  if (!isLocalDateKey(task.dueDate)) {
    return false;
  }
  return task.dueDate === today;
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionPercentage(tasks: Task[]): number {
  if (tasks.length === 0) {
    return 0;
  }
  const completedCount = tasks.filter((task) => task.completed).length;
  return Math.round((completedCount / tasks.length) * 100);
}

/**
 * Sort tasks by priority (high -> medium -> low)
 */
export function sortTasksByPriority(tasks: Task[]): Task[] {
  const priorityOrder: Record<TaskPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return [...tasks].sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Sort tasks by due date (earliest first)
 */
export function sortTasksByDueDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    if (!isLocalDateKey(a.dueDate) && !isLocalDateKey(b.dueDate)) return 0;
    if (!isLocalDateKey(a.dueDate)) return 1;
    if (!isLocalDateKey(b.dueDate)) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

/**
 * Sort tasks by creation date (newest first)
 */
export function sortTasksByCreatedAt(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Filter tasks by filter type
 */
export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  switch (filter) {
    case 'active':
      return tasks.filter((task) => !task.completed);
    case 'completed':
      return tasks.filter((task) => task.completed);
    case 'high':
      return tasks.filter((task) => task.priority === 'high');
    case 'medium':
      return tasks.filter((task) => task.priority === 'medium');
    case 'low':
      return tasks.filter((task) => task.priority === 'low');
    case 'all':
    default:
      return tasks;
  }
}

/**
 * Date filters used by the primary Tasks route.
 * Today is the actionable queue: incomplete overdue, due-today, and undated
 * tasks. Upcoming is strictly incomplete tasks after today. Completed tasks
 * appear only in All and Done.
 */
export function filterTasksByDate(
  tasks: Task[],
  filter: TaskDateFilter,
  today: string = toLocalDateKey(),
): Task[] {
  switch (filter) {
    case "today":
      return tasks.filter(
        (task) =>
          !task.completed &&
          (!task.dueDate ||
            (isLocalDateKey(task.dueDate) && task.dueDate <= today)),
      );
    case "upcoming":
      return tasks.filter(
        (task) =>
          !task.completed &&
          isLocalDateKey(task.dueDate) &&
          task.dueDate > today,
      );
    case "done":
      return tasks.filter((task) => task.completed);
    case "all":
    default:
      return tasks;
  }
}

/**
 * Search tasks by query
 */
export function searchTasks(tasks: Task[], query: string): Task[] {
  const lowerQuery = query.toLowerCase();
  return tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(lowerQuery) ||
      (task.description && task.description.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get task priority label
 */
export function getPriorityLabel(priority: TaskPriority): string {
  switch (priority) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
  }
}

/**
 * Get task status label
 */
export function getStatusLabel(task: Task): string {
  return task.completed ? 'Completed' : 'Todo';
}
