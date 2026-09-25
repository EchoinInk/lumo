import { useEffect, useMemo } from "react";
import { useLocalDay } from "@/src/hooks/useLocalDay";
import { weekdayIndexForLocalDate } from "@/src/utils/dateTime";
import { useHabitStore } from "../store/useHabitStore";
import { CreateHabitInput, Habit, UpdateHabitInput } from "../types/habit";

export function useHabits() {
  const today = useLocalDay();
  const {
    habits,
    isHydrated,
    isLoading,
    error,
    hydrate,
    addHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    uncompleteHabit,
    clearError,
  } = useHabitStore();

  // Hydrate on mount
  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [isHydrated, hydrate]);

  const currentDay = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[weekdayIndexForLocalDate(today)];
  }, [today]);

  // Filter habits that should be done today
  const todayHabits = useMemo(() => {
    return habits.filter((habit) => {
      if (habit.frequency === "daily") return true;
      if (habit.frequency === "weekly" && habit.targetDays) {
        return habit.targetDays.includes(currentDay);
      }
      return true;
    });
  }, [habits, currentDay]);

  // Habits completed today
  const completedToday = useMemo(() => {
    return todayHabits.filter((habit) => habit.completedDates.includes(today));
  }, [todayHabits, today]);

  // Habits pending today
  const pendingToday = useMemo(() => {
    return todayHabits.filter((habit) => !habit.completedDates.includes(today));
  }, [todayHabits, today]);

  // Completion rate for today
  const completionRate = useMemo(() => {
    if (todayHabits.length === 0) return 0;
    return Math.round((completedToday.length / todayHabits.length) * 100);
  }, [completedToday.length, todayHabits.length]);

  // Total streak across all habits
  const totalStreak = useMemo(() => {
    return habits.reduce((sum, habit) => sum + habit.streakCount, 0);
  }, [habits]);

  // Best streak
  const bestStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map((h) => h.streakCount));
  }, [habits]);

  // Counts
  const totalCount = habits.length;
  const completedCount = completedToday.length;
  const pendingCount = pendingToday.length;

  // Wrapper functions with error handling
  const handleAddHabit = async (input: CreateHabitInput) => {
    await addHabit(input);
  };

  const handleUpdateHabit = async (id: string, updates: UpdateHabitInput) => {
    await updateHabit(id, updates);
  };

  const handleDeleteHabit = async (id: string) => {
    await deleteHabit(id);
  };

  const handleCompleteHabit = async (id: string) => {
    await completeHabit(id, today);
  };

  const handleUncompleteHabit = async (id: string) => {
    await uncompleteHabit(id, today);
  };

  const toggleHabit = async (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    if (habit.completedDates.includes(today)) {
      await handleUncompleteHabit(id);
    } else {
      await handleCompleteHabit(id);
    }
  };

  const isCompletedToday = (habit: Habit) => {
    return habit.completedDates.includes(today);
  };

  return {
    // Data
    habits,
    todayHabits,
    completedToday,
    pendingToday,

    // Counts
    totalCount,
    completedCount,
    pendingCount,

    // Stats
    completionRate,
    totalStreak,
    bestStreak,

    // State
    isHydrated,
    isLoading,
    error,

    // Actions
    addHabit: handleAddHabit,
    updateHabit: handleUpdateHabit,
    deleteHabit: handleDeleteHabit,
    completeHabit: handleCompleteHabit,
    uncompleteHabit: handleUncompleteHabit,
    toggleHabit,
    isCompletedToday,
    clearError,
  };
}
