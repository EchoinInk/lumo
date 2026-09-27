# Local date and time policy

Lumo keeps three date/time representations distinct:

- **Local date key:** `YYYY-MM-DD`, for a civil day such as a task due date, habit completion date, or planning summary date. It has no time or timezone and must never be produced by slicing an instant's UTC string.
- **Wall-clock time:** `HH:mm` in 24-hour form, for a time-of-day choice such as a task due time or quiet-hours boundary. It has no date, offset, or independent instant.
- **Timestamp instant:** an ISO 8601 timestamp with `Z` or an explicit offset, for a real point on the timeline such as `createdAt`, `updatedAt`, or `scheduledAt`. New instants are serialized canonically with `Date#toISOString()`.

## Operations

`src/utils/dateTime.ts` owns parsing, validation, formatting, local-day extraction, calendar-day/month arithmetic, weekday lookup, local date/time resolution, and absolute timestamp creation. Date keys are compared lexicographically because the canonical format is year-first. Calendar days are moved by Gregorian calendar fields, never by adding or subtracting 86,400,000 milliseconds.

The date-key arithmetic uses UTC internally only as a timezone-free Gregorian calculator. It does not convert an instant into a local day and does not expose the internal `Date` as an instant.

Mounted day-dependent views use `useLocalDay`. The hook refreshes at the next local midnight and whenever the app becomes active. Foreground refresh also recalculates the next midnight, so manual clock or timezone changes do not leave an old timer in force.

## Task scheduling and list filters

New task due dates must be valid local date keys. New task due times must use canonical 24-hour `HH:mm` form and require a due date. The same validation runs in the form and canonical local repository, so alternate callers cannot persist a schedule the primary form would reject. Clearing a date in the task form also clears its time. Existing ambiguous legacy values remain byte-preserved when an unrelated edit does not change them, as described below.

The primary Tasks route uses these date boundaries:

- **Today:** active overdue tasks, active tasks due on the current local day, and active undated tasks.
- **Upcoming:** active tasks with a valid date strictly after the current local day.
- **Done:** all completed tasks, regardless of their due date.
- **All:** every non-deleted task returned by the canonical repository.

Completed tasks do not also appear in Today or Upcoming. Invalid legacy date text is retained for recovery/editing but is not guessed into a date-scoped filter.

## DST and timezone behavior

- A local date key remains the same civil date when the device timezone changes. It is not shifted.
- An absolute instant remains the same point in time and is displayed in the device's current timezone.
- A wall-clock time is resolved only together with a local date. JavaScript's local calendar rules are used: in a spring-forward gap the clock advances to the first representable local time; in a repeated fall-back interval the earlier occurrence is selected.
- Reminder presets resolve their chosen local date and wall time to an absolute instant when the reminder is created. A later timezone change does not silently rewrite that stored instant. Notification reconciliation policy remains owned by the later reminder work package.
- Day and month movement uses civil calendar arithmetic. Month movement clamps to the final valid day of the target month (for example, January 31 plus one month becomes February 28 or 29).

## Migration and compatibility

Existing canonical local date keys and timestamp instants are retained byte-for-byte during normal loads. This work does not bulk-rewrite storage or reinterpret legacy text. Ambiguous values are not assigned a guessed time, offset, or timezone; they remain unchanged until a user explicitly edits them or a future domain-specific migration has enough information to resolve them safely. New and edited values produced by affected features use the canonical representations above.
