import {
  getReminderScheduledAt,
} from "@/features/reminders";
import { assert, assertEqual } from "../testUtils";

export function testReminderScheduleTomorrowUsesNextMorning(): void {
  const scheduledAt = getReminderScheduledAt(
    "tomorrow",
    new Date("2026-06-03T10:15:00.000Z"),
  );

  assert(Boolean(scheduledAt), "tomorrow schedule should return a timestamp");
  assertEqual(
    new Date(scheduledAt!).getDate(),
    4,
    "tomorrow schedule should use the next day",
  );
}

export function testReminderScheduleNoneLeavesReminderUnscheduled(): void {
  assertEqual(
    getReminderScheduledAt("none", new Date("2026-06-03T10:15:00.000Z")),
    undefined,
    "no time should not set scheduledAt",
  );
}

export function testAucklandReminderTomorrowUsesWallClockAcrossDstStart(): void {
  const previousTimeZone = process.env.TZ;
  process.env.TZ = "Pacific/Auckland";
  try {
    const scheduledAt = getReminderScheduledAt(
      "tomorrow",
      new Date("2026-09-26T10:00:00.000Z"),
    );
    assertEqual(
      scheduledAt,
      "2026-09-26T20:00:00.000Z",
      "tomorrow at 09:00 should honor Auckland's spring DST offset",
    );
  } finally {
    if (previousTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimeZone;
  }
}

export function testAucklandReminderTomorrowUsesWallClockAcrossDstEnd(): void {
  const previousTimeZone = process.env.TZ;
  process.env.TZ = "Pacific/Auckland";
  try {
    const scheduledAt = getReminderScheduledAt(
      "tomorrow",
      new Date("2026-04-04T10:00:00.000Z"),
    );
    assertEqual(
      scheduledAt,
      "2026-04-04T21:00:00.000Z",
      "tomorrow at 09:00 should honor Auckland's autumn DST offset",
    );
  } finally {
    if (previousTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimeZone;
  }
}
