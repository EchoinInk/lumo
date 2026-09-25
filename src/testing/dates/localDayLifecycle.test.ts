import { subscribeToLocalDayRefresh } from "@/src/utils/localDayLifecycle";
import { assert, assertEqual } from "../testUtils";

export function testForegroundAndMidnightRefreshDayDependentState(): void {
  let now = new Date(2026, 11, 31, 23, 59, 30);
  let appStateListener: ((state: string) => void) | undefined;
  let timerCallback: (() => void) | undefined;
  let timerDelay = 0;
  let removed = false;
  const refreshes: { dateKey: string; reason: string }[] = [];

  const unsubscribe = subscribeToLocalDayRefresh(
    (dateKey, reason) => refreshes.push({ dateKey, reason }),
    {
      now: () => now,
      appState: {
        addEventListener: (_event, listener) => {
          appStateListener = listener;
          return { remove: () => { removed = true; } };
        },
      },
      setTimer: (callback, delay) => {
        timerCallback = callback;
        timerDelay = delay;
        return 1;
      },
      clearTimer: () => undefined,
    },
  );

  assert(timerDelay >= 30_000 && timerDelay < 31_000, "midnight timer should target the next local day");
  now = new Date(2027, 0, 1, 0, 0, 1);
  appStateListener?.("background");
  assertEqual(refreshes.length, 0, "background transitions should not refresh");
  appStateListener?.("active");
  assertEqual(refreshes[0]?.dateKey, "2027-01-01", "foreground should recalculate today");
  assertEqual(refreshes[0]?.reason, "foreground", "foreground reason should be explicit");

  now = new Date(2027, 0, 2, 0, 0, 1);
  timerCallback?.();
  assertEqual(refreshes[1]?.dateKey, "2027-01-02", "midnight should refresh the local day");
  assertEqual(refreshes[1]?.reason, "local-day-change", "midnight reason should be explicit");

  unsubscribe();
  assertEqual(removed, true, "lifecycle listener should be removed on cleanup");
}

export function testForegroundRefreshObservesTimezoneChanges(): void {
  const previousTimeZone = process.env.TZ;
  let listener: ((state: string) => void) | undefined;
  const dateKeys: string[] = [];
  process.env.TZ = "Pacific/Auckland";

  try {
    const instant = new Date("2026-01-01T12:30:00.000Z");
    const unsubscribe = subscribeToLocalDayRefresh(
      (dateKey) => dateKeys.push(dateKey),
      {
        now: () => instant,
        appState: {
          addEventListener: (_event, nextListener) => {
            listener = nextListener;
            return { remove: () => undefined };
          },
        },
        setTimer: () => 1,
        clearTimer: () => undefined,
      },
    );

    process.env.TZ = "America/Los_Angeles";
    listener?.("active");
    assertEqual(
      dateKeys[0],
      "2026-01-01",
      "foreground refresh should recalculate the day in the new timezone",
    );
    unsubscribe();
  } finally {
    if (previousTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimeZone;
  }
}
