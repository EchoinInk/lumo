/**
 * @deprecated Compatibility export only.
 *
 * Habits are owned by the feature store and HabitLocalRepository. Keeping this
 * path as an alias prevents the former `habit-storage` Zustand store from
 * becoming a second production source after its records have been migrated.
 */
export { useHabitStore } from "@/features/habits/store/useHabitStore";
export type { Habit } from "@/features/habits/types/habit";
