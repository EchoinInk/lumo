/**
 * @deprecated Compatibility export only.
 *
 * Tasks are owned by the feature store and TaskLocalRepository. Keeping this
 * path as an alias prevents old imports from creating a second in-memory task
 * source while downstream code is migrated incrementally.
 */
export { useTaskStore } from "@/features/tasks/store/useTaskStore";
export type { Task } from "@/features/tasks/types/task";
