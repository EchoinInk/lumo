import { useEffect } from "react";
import { useReminderStore } from "../store/useReminderStore";

export function useReminders() {
  const hasHydrated = useReminderStore((state) => state.hasHydrated);
  const isLoading = useReminderStore((state) => state.isLoading);
  const hydrate = useReminderStore((state) => state.hydrate);

  useEffect(() => {
    if (!hasHydrated && !isLoading) void hydrate();
  }, [hasHydrated, hydrate, isLoading]);

  return useReminderStore();
}
