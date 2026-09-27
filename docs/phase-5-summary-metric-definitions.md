# Phase 5 canonical summary metric definitions

All windows use local civil `YYYY-MM-DD` dates. Summary values are derived at render time from canonical domain stores; none of the totals below is persisted.

| Surface / metric | Date window | Canonical source | Denominator and attribution | Deleted / unknown handling | Unit |
|---|---|---|---|---|---|
| Dashboard today's task progress | Selected local day, exact due date | Task store | Active tasks with `dueDate === day`; completion belongs to the due date, irrespective of when the toggle occurred | Deleted, future, overdue and unscheduled tasks excluded | count and percent |
| Dashboard / Health today's habit progress | Selected local day | Habit store and dated completion history | Active habits scheduled for the day; completed only when the exact day exists in `completedDates` | Deleted habits and unrelated history excluded; no scheduled habits is an empty state | count and percent |
| Health current habit streak | Through selected local day | Habit store and dated completion history | Longest current scheduled-day streak among active habits | Deleted habits excluded; no habits is unknown (`null`), not a zero-day achievement | days |
| Health calorie intake | One selected local day | Consumed-meal store | Consumed meal records dated to the day; planned meal assignments are not accepted as input | Deleted meals excluded; missing calories are counted as unknown and never inferred | kcal and entry count |
| Health calorie goal progress | Same day as intake | Calorie preference plus consumed-meal selector | Known kcal divided by configured positive goal | Missing goal is unset; unknown meal calories stay outside numerator and remain disclosed | percent and kcal |
| Health current weight and change | All active entries on or before today | Weight store | Latest entry and immediately previous dated entry | Deleted and future-dated entries excluded; missing latest/change is unknown | grams canonically, displayed kg or lb |
| Health workout week | Monday inclusive to next Monday exclusive | Workout store | Active workout records in the window | Deleted records excluded; missing calorie estimates are counted unknown and never inferred | workout count, minutes, kcal |
| Budget month totals and category totals | Calendar month, start inclusive / next month exclusive | Budget-category store and transaction ledger | Active categories provide planned amounts; ledger expense/income records provide actuals | Deleted transactions/categories excluded; uncategorised historical transaction snapshots remain in overall actuals | NZD minor units, displayed as NZD |

Payment status is not independently added to budget actuals. A paid payment is represented by its single idempotent `sourcePaymentId`-linked ledger expense; therefore the ledger remains the only actual-spending source.
