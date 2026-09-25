import {
  millisecondsUntilNextLocalDay,
  toLocalDateKey,
  type LocalDateKey,
} from "./dateTime";

export type LocalDayRefreshReason = "foreground" | "local-day-change";
type TimerHandle = ReturnType<typeof setTimeout> | number;

export interface AppStateChangeSource {
  addEventListener(
    event: "change",
    listener: (state: string) => void,
  ): { remove(): void };
}

export interface LocalDayRefreshDependencies {
  appState: AppStateChangeSource;
  now?: () => Date;
  setTimer?: (callback: () => void, delay: number) => TimerHandle;
  clearTimer?: (timer: TimerHandle) => void;
}

export function subscribeToLocalDayRefresh(
  onRefresh: (dateKey: LocalDateKey, reason: LocalDayRefreshReason) => void,
  dependencies: LocalDayRefreshDependencies,
): () => void {
  const now = dependencies.now ?? (() => new Date());
  const setTimer =
    dependencies.setTimer ?? ((callback, delay) => setTimeout(callback, delay));
  const clearTimer =
    dependencies.clearTimer ??
    ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>));
  let timer: TimerHandle | undefined;
  let disposed = false;

  const armMidnightTimer = () => {
    if (timer !== undefined) clearTimer(timer);
    const delay = millisecondsUntilNextLocalDay(now()) + 50;
    timer = setTimer(() => {
      if (disposed) return;
      onRefresh(toLocalDateKey(now()), "local-day-change");
      armMidnightTimer();
    }, delay);
  };

  const subscription = dependencies.appState.addEventListener(
    "change",
    (state) => {
      if (state !== "active" || disposed) return;
      onRefresh(toLocalDateKey(now()), "foreground");
      armMidnightTimer();
    },
  );

  armMidnightTimer();
  return () => {
    disposed = true;
    if (timer !== undefined) clearTimer(timer);
    subscription.remove();
  };
}
