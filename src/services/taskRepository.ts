import { taskLocalRepository } from "@/features/tasks/services/taskLocalRepository";
import type { Task } from "@/features/tasks/types/task";
import type { AsyncResult } from "@/types/result";
import { err, ok } from "@/types/result";

/**
 * @deprecated Use TaskLocalRepository from the tasks feature.
 * This facade delegates every operation to the canonical repository so an old
 * import cannot create a second task source.
 */
export class TaskRepository {
  async getAll(): AsyncResult<Task[]> {
    return this.capture(() => taskLocalRepository.getAll());
  }

  async getById(id: string): AsyncResult<Task | null> {
    return this.capture(() => taskLocalRepository.getById(id));
  }

  async create(
    task: Omit<Task, "id" | "createdAt" | "updatedAt">,
  ): AsyncResult<Task> {
    return this.capture(() =>
      taskLocalRepository.createTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        energyRequired: task.energyRequired,
        recurrence: task.recurrence,
        dueDate: task.dueDate,
        dueTime: task.dueTime,
      }),
    );
  }

  async update(id: string, updates: Partial<Task>): AsyncResult<Task> {
    return this.capture(() => taskLocalRepository.updateTask(id, updates));
  }

  async delete(id: string): AsyncResult<boolean> {
    return this.capture(async () => {
      await taskLocalRepository.deleteTask(id);
      return true;
    });
  }

  async filter(filters: {
    completed?: boolean;
    priority?: "low" | "medium" | "high";
    dueDate?: string;
  }): AsyncResult<Task[]> {
    return this.capture(async () => {
      const tasks = await taskLocalRepository.getTasks();
      return tasks.filter(
        (task) =>
          (filters.completed === undefined || task.completed === filters.completed) &&
          (filters.priority === undefined || task.priority === filters.priority) &&
          (filters.dueDate === undefined || task.dueDate === filters.dueDate),
      );
    });
  }

  private async capture<T>(operation: () => Promise<T>): AsyncResult<T> {
    try {
      return ok(await operation());
    } catch (error) {
      return err(error instanceof Error ? error.message : String(error));
    }
  }
}

export const taskRepository = new TaskRepository();
