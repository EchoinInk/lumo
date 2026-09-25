import {
  addLocalDays,
  addLocalMonths,
  isLocalDateKey,
  isTimestampInstant,
  isWallClockTime,
  toLocalDateKey,
  weekdayIndexForLocalDate,
} from "@/src/utils/dateTime";
import { assertEqual } from "../testUtils";

export function testAucklandLocalDayBoundariesUseCivilDate(): void {
  assertEqual(
    toLocalDateKey(new Date("2026-01-01T10:59:59.999Z"), "Pacific/Auckland"),
    "2026-01-01",
    "Auckland should remain on January 1 immediately before local midnight",
  );
  assertEqual(
    toLocalDateKey(new Date("2026-01-01T11:00:00.000Z"), "Pacific/Auckland"),
    "2026-01-02",
    "Auckland should roll to January 2 at local midnight",
  );
  assertEqual(
    toLocalDateKey(new Date("2026-06-30T12:00:00.000Z"), "Pacific/Auckland"),
    "2026-07-01",
    "Auckland winter offset should roll at its actual local midnight",
  );
}

export function testPositiveAndNegativeOffsetsDoNotUseUtcDate(): void {
  const instant = new Date("2026-01-01T07:30:00.000Z");
  assertEqual(
    toLocalDateKey(instant, "Pacific/Kiritimati"),
    "2026-01-01",
    "UTC+14 should use its local date",
  );
  assertEqual(
    toLocalDateKey(instant, "America/Los_Angeles"),
    "2025-12-31",
    "a negative offset should retain the previous local date",
  );
}

export function testDstTransitionKeepsCalendarArithmeticStable(): void {
  assertEqual(
    toLocalDateKey(new Date("2026-09-26T13:59:59.000Z"), "Pacific/Auckland"),
    "2026-09-27",
    "the instant before Auckland's DST jump should be on September 27",
  );
  assertEqual(
    toLocalDateKey(new Date("2026-09-26T14:00:00.000Z"), "Pacific/Auckland"),
    "2026-09-27",
    "the instant after Auckland's skipped hour should remain on September 27",
  );
  assertEqual(
    addLocalDays("2026-09-26", 1),
    "2026-09-27",
    "calendar-day movement should not depend on a 23-hour DST day",
  );
}

export function testMonthAndYearRolloverClampToValidDates(): void {
  assertEqual(addLocalDays("2025-12-31", 1), "2026-01-01", "year rollover");
  assertEqual(addLocalDays("2028-02-28", 1), "2028-02-29", "leap day rollover");
  assertEqual(addLocalMonths("2026-01-31", 1), "2026-02-28", "month-end clamp");
  assertEqual(addLocalMonths("2028-01-31", 1), "2028-02-29", "leap month clamp");
  assertEqual(weekdayIndexForLocalDate("2026-01-01"), 4, "weekday should be stable");
}

export function testRepresentationsRemainDistinct(): void {
  assertEqual(isLocalDateKey("2026-02-28"), true, "valid date key");
  assertEqual(isLocalDateKey("2026-02-30"), false, "impossible date key");
  assertEqual(isLocalDateKey("2026-02-28T09:00:00Z"), false, "instant is not a date key");
  assertEqual(isWallClockTime("09:30"), true, "valid wall-clock time");
  assertEqual(isWallClockTime("9:30"), false, "wall time must be canonical");
  assertEqual(isTimestampInstant("2026-02-28T09:30:00Z"), true, "valid instant");
  assertEqual(isTimestampInstant("2026-02-28"), false, "date key is not an instant");
}
