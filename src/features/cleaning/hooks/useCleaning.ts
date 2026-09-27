import { useLocalDay } from "@/hooks/useLocalDay";
import { addLocalDays } from "@/utils/dateTime";
import { useEffect, useMemo } from "react";
import { cleaningOccurrences, latestActionableOccurrence, startOfLocalWeek } from "../services/cleaningSchedule";
import { useCleaningStore } from "../store/useCleaningStore";

export function useCleaning() {
  const store = useCleaningStore();
  const today = useLocalDay();
  useEffect(() => {
    if (!store.isHydrated && !store.isLoading) void store.hydrate().catch(() => undefined);
  }, [store.isHydrated, store.isLoading, store.hydrate]);

  const weekStart = startOfLocalWeek(today);
  const elapsedOccurrences = useMemo(
    () => cleaningOccurrences(store.items, weekStart, today),
    [store.items, weekStart, today],
  );
  const completedCount = elapsedOccurrences.filter((item) => item.completed).length;
  return {
    ...store,
    today,
    weekStart,
    weekEnd: addLocalDays(weekStart, 6),
    completedCount,
    occurrenceCount: elapsedOccurrences.length,
    progress: elapsedOccurrences.length === 0 ? 0 : Math.round(completedCount / elapsedOccurrences.length * 100),
    actionableDate: (id: string) => {
      const item = store.items.find((value) => value.id === id);
      return item ? latestActionableOccurrence(item, today) : null;
    },
  };
}
