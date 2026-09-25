import { calculateStreak } from "@/src/features/habits/services/habitLocalRepository";
import { assertEqual } from "../testUtils";

export function testHabitStreakUsesConsecutiveLocalDateKeys(): void {
  assertEqual(
    calculateStreak(["2026-09-26", "2026-09-27"], "2026-09-27"),
    2,
    "habit streak should cross Auckland's DST-start weekend by civil dates",
  );
}

export function testHabitStreakCanContinueFromYesterday(): void {
  assertEqual(
    calculateStreak(["2025-12-31"], "2026-01-01"),
    1,
    "an unfinished current day should retain the streak through yesterday",
  );
}
