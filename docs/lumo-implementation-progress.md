## WP1.1 - Verified

WP1.1 is complete. Native Hermes production exports now pass for both platforms, and local startup no longer imports or initializes Supabase.

## Completion record

**Audit IDs addressed**

- **B01:** Closed - the audited iOS and Android Hermes failures were reproduced, then resolved.
- **B20:** Account surface excluded from the local release.
- **B34:** Added route-graph regression coverage.
- **S40 / S43:** Deferred cloud/account implementation remains isolated and unexposed.

**Architectural change**

- Removed auth bootstrap and callback handling from [app/_layout.tsx](/Users/echoin.ink/Developer/lumo/app/_layout.tsx:7).
- Removed account state, Sign in/Account menu entry, and account-route link from [More](/Users/echoin.ink/Developer/lumo/app/(tabs)/more/index.tsx:58).
- Moved the account screen and all six `/auth/*` route files outside Expo Router's `app/` tree into `src/features/auth/deferred-routes/`.
- Documented the isolation boundary in [README.md](/Users/echoin.ink/Developer/lumo/src/features/auth/deferred-routes/README.md:1).
- Added regression coverage in [routeScan.test.ts](/Users/echoin.ink/Developer/lumo/src/testing/routes/routeScan.test.ts:65).
- No persistence implementation, storage key, local data, Hermes setting, dependency version, or navigation structure was changed.

This follows Expo SDK 55's behavior: native production async routes are disabled, so route files remain part of the native graph. Hermes bytecode generation remains enabled as recommended. [Expo Router SDK 55](https://docs.expo.dev/versions/v55.0.0/sdk/router/), [Hermes documentation](https://docs.expo.dev/guides/using-hermes/).

**Validation**

- Pre-change iOS export: failed at Supabase's computed dynamic `import(OTEL_PKG)`.
- Pre-change Android export without dotenv/Supabase variables: failed at the same expression.
- TypeScript: passed.
- Existing and new tests: **106 passed, 0 failed**.
- Focused ESLint: **0 errors**, 5 existing warnings in preserved deferred screens.
- Web production export without dotenv/Supabase variables: passed.
- iOS Hermes production export without dotenv/Supabase variables: passed.
- Android Hermes production export without dotenv/Supabase variables: passed.
- Generated web/iOS/Android artifacts and native source maps contain no `@supabase`, `supabaseAuth`, deferred route, `/auth`, or account-route markers.
- `git diff --check`: passed.

**Manual verification performed**

- Served the exported web production application locally with Supabase configuration disabled.
- Confirmed Dashboard opened directly as the local application.
- Opened More and confirmed no Account or Sign in entry was exposed.
- Manually inspected the live route tree and generated native source maps to confirm account routes and Supabase were absent.

A native device installation/cold-launch was not claimed; that belongs to WP1.3.

**Remaining risks**

- Supabase and deferred auth code remain installed and preserved. Reintroducing those modules into `app/` would restore the current Hermes incompatibility.
- Deferred screens retain five lint warnings.
- Native installation, process restart, and airplane-mode device testing remain outstanding for WP1.3.
- Dependency compatibility/security disposition remains WP1.2 scope.

**Status**

- **WP1.1:** Complete.
- **G1 impact:** B01/export portion closed. G1 overall remains open pending WP1.2 dependency disposition and WP1.3 installable native/offline-launch verification.

---

## WP1.2 - Verified

WP1.2 is complete. The repository now uses a Doctor-aligned Expo SDK 55 dependency set, the npm lockfile reproduces under normal peer enforcement, and all serious dependency advisories have been remediated or explicitly triaged.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP1.2 — Resolve compatibility and security findings** |
| **Audit coverage** | **B33:** compatibility and advisory backlog resolved/triaged. Supports the dependency-disposition portion of **G1**. WP1.1 findings were not reopened. |
| **Changes** | Updated all 11 Doctor-reported Expo/RN patches; declared directly imported `expo-image`, `expo-symbols` and `globals`; installed the required `expo-font` native peer/plugin; moved `lucide-react-native` to its first checked React 19-compatible line; aligned Zustand 5 with the manifest's previous intended resolution; removed `legacy-peer-deps`, the contradictory Yarn-only `resolutions` entry and an unusable legacy Webpack config; refreshed only compatible vulnerable transitive packages. MMKV/Nitro, Reanimated/Worklets, Metro and related Expo infrastructure remain installed and verified. |
| **Data compatibility** | No storage keys, persisted shapes, migrations or application data were changed. Zustand's used `create`, `persist` and `createJSONStorage` APIs remain covered by the full test suite. |
| **Automated checks** | `npm ci` passed; `npm install --package-lock-only --dry-run` passed with normal peer enforcement; Expo Doctor **20/20**; production audit **0 critical, 0 high, 13 moderate, 0 low**; TypeScript passed; tests **106 passed, 0 failed**; lint **0 errors, 88 existing warnings**; web export passed; iOS Hermes production export passed; Android Hermes production export passed; `npm ls --all` exited successfully; `git diff --check` passed. All three exports ran with dotenv disabled. |
| **Manual verification** | Inspected each remaining advisory's installed path and call site. Confirmed Expo Router uses `query-string` only for stringify while its vulnerable decoder is not called, and `xcode` uses bufferless UUID v4 while the advisory affects buffered v3/v5/v6. Confirmed the installed native framework tree retains MMKV 4.3.1 -> Nitro 0.35.9, Reanimated 4.2.1 -> Worklets 0.7.4 and Expo Metro 55.1.2 -> Metro 0.83.8. No device install or cold-launch claim is made; that remains WP1.3. |
| **Outstanding work** | The 13 moderate audit entries are two accepted upstream transitive risks documented in [dependency-security-triage.md](/Users/echoin.ink/Developer/lumo/docs/dependency-security-triage.md): an unreachable SDK 55 Router decoder path and a build-only Expo/Xcode UUID path whose affected API is not invoked. Recheck when Expo publishes compatible patches. Existing lint warnings remain outside this dependency package. |
| **Status** | **Verified** |
| **Gate effect** | WP1.2's compatibility/security dependency requirement for **G1** is satisfied. G1 remains open only for WP1.3 installable native builds and device/offline-launch evidence. WP1.3 has not begun. |

---

### Android native verification — 2026-09-28

The previously recorded Android host/tooling blocker has been resolved.

Host/tooling evidence:

- OpenJDK 17 is installed and working.
- Android Debug Bridge is installed and working.
- Android API 36 ARM64 emulator is available and connected as `emulator-5554`.
- `./gradlew app:assembleRelease` completed successfully.
- Release APK was generated at:
  `android/app/build/outputs/apk/release/app-release.apk`
- `adb install -r app/build/outputs/apk/release/app-release.apk` completed successfully.
- `com.meltmyheart.lumo` launched successfully on the Android emulator.
- Force-stop and relaunch completed successfully.
- Persisted local application state remained available after relaunch.
- Wi-Fi and mobile data were disabled, the app was force-stopped, and Lumo relaunched successfully in its local guest experience without requiring network access or account sign-in.
- Network access was restored after verification.

## WP1.3 — Implementation complete; simulator/emulator acceptance verified; physical-device acceptance outstanding

- iOS Release simulator compile/install/relaunch: passed
- Android Release compile: passed
- Android emulator install/cold launch: passed
- Android emulator process restart: passed
- Android emulator offline reopen: passed
- Physical iOS device acceptance: not performed
- Physical Android device acceptance: not performed

**WP1.3 status:** Implementation complete; simulator/emulator acceptance verified; physical-device acceptance outstanding.

**G1 effect:** Android tooling and emulator acceptance blockers are closed. G1 remains open only for the explicitly required physical-device smoke checks, which remain mandatory before G8 release qualification.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP1.3 — Establish installable builds and native validation gates** |
| **Audit coverage** | Implements the missing release/build identity and native-validation portions of **B32**, and extends the automated gate coverage associated with **B34**. No Phase 2 work was started. |
| **Build configuration** | Added tracked iOS build number, Android version code, application icons, local version sourcing, and EAS `development`, `development-simulator`, `preview`, `preview-simulator`, and reserved `production` profiles. Development profiles create development clients; preview profiles create installable internal-distribution artifacts; production remains store-distributed but has no submission configuration. |
| **Local-first guard** | Config and export scripts set `EXPO_NO_DOTENV=1` and remove Lumo's public API/Supabase variables. The config gate also rejects an EAS Update URL and checks that no backend variable name is exposed in resolved public config. No update channel, runtime version, submit profile, backend secret, account bootstrap, or cloud runtime dependency was added. |
| **Commands and runbook** | Exact clean-generation, export, local compilation, EAS build, and physical-device smoke-test commands are recorded in [native-build-validation.md](/Users/echoin.ink/Developer/lumo/docs/native-build-validation.md). |
| **Automated evidence (2026-09-24)** | Credential-free config resolution passed; TypeScript passed; tests **106 passed, 0 failed**; lint **0 errors, 88 existing warnings**; Expo Doctor **20/20**; web export passed; iOS Hermes export passed; Android Hermes export passed; clean `expo prebuild --clean --no-install` passed in an isolated copy; iOS CocoaPods resolution passed. |
| **Native compile and runtime evidence (updated 2026-09-28)** | iOS unsigned Release simulator compilation passed with Xcode 26.6 and CocoaPods 1.17.0. The Release build installed on an iPhone 17 Pro / iOS 26.5 simulator and passed cold launch and terminate/relaunch. Android tooling is now available with OpenJDK 17 and ADB. An Android API 36 ARM64 emulator was connected as `emulator-5554`; `./gradlew app:assembleRelease` completed successfully, the Release APK installed successfully, Lumo launched successfully, force-stop/relaunch passed, persisted local state remained available, and offline reopen passed with Wi-Fi/mobile data disabled. |
| **Unavailable acceptance evidence** | Physical iOS and Android device verification has not been performed. Simulator/emulator evidence does not substitute for the explicitly required physical-device smoke checks. |
| **Status** | **Implementation complete; simulator/emulator acceptance verified; physical-device acceptance outstanding** |
| **Gate effect** | Android tooling, Release compilation, emulator install, process restart and offline-launch blockers are closed. G1 remains open only for the required physical-device acceptance checks, which must be completed before G8 release qualification. |

## G1 Phase Acceptance Gate - PARTIAL

**PARTIAL.** Automated exports, iOS Release simulator compile/install/cold launch/restart, and Android Release emulator compile/install/cold launch/restart/offline reopen pass. The exact remaining evidence gap is physical-device smoke verification on both iOS and Android. Simulator/emulator results are not physical-device evidence. The accepted G1 deferral requires this evidence before G8 release qualification.

---

## WP2.1 - Verified

WP2.1 is complete. Tasks, habits, settings and onboarding each have one authoritative production owner; both historical storage facades now share a compatible namespace-aware adapter; legacy records have explicit non-destructive migration precedence; and development-web persistence is durable across reloads.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP2.1 — Establish canonical ownership and storage compatibility** |
| **Audit coverage** | Addresses the duplicate ownership and persistence compatibility portions of **B17**, **B27** and **B35**. Schema envelopes/recovery, serialized mutation safety and local-date semantics remain assigned to WP2.2–WP2.4. |
| **Canonical ownership** | Tasks: feature task store + `taskLocalRepository`, default namespace / `tasks`. Habits: feature habit store + `habitLocalRepository`, default namespace / `habits`. Settings: global settings store, `lumo-storage` / `settings-storage`. Onboarding: feature onboarding store, default namespace / `onboarding`. The executable registry and full inventory are recorded in [local-data-ownership.md](/Users/echoin.ink/Developer/lumo/docs/local-data-ownership.md). |
| **Adapter compatibility** | Both former MMKV facades now use one adapter contract while preserving the default and historical `lumo-storage` namespaces. It supports both `remove` and legacy `delete`, namespace-scoped clearing, existing unprefixed default keys, and isolated named-namespace keys. Browser persistence uses `localStorage`; memory fallback is restricted to non-browser/SSR environments. |
| **Migration precedence** | A present canonical record always wins, including an intentional empty collection. Otherwise the newest compatible known legacy source wins; incompatible collections are preserved atomically and skipped rather than partially merged. Selected, conflicting and invalid legacy records are never deleted. Re-running migration never overwrites the canonical target. Exact per-domain precedence and identifier mappings are documented and executable in `canonicalMigrations.ts`. |
| **Obsolete paths** | Legacy task, habit and onboarding store modules are compatibility re-exports only. Generic task/habit repositories delegate to canonical feature repositories. Legacy onboarding service/hooks derive from or delegate to the canonical store and cannot silently reactivate an independent persisted source. |
| **Automated checks (2026-09-25)** | TypeScript passed; tests **117 passed, 0 failed**; lint **0 errors, 86 warnings** (two fewer than the recorded baseline); web export passed; iOS Hermes production export passed; Android Hermes production export passed; `git diff --check` passed. New tests cover existing-key compatibility, namespace isolation, adapter recreation/web reload durability, repeatable migration, conflicting legacy fixtures, atomic rejection of incompatible collections, historical settings migration, onboarding identifier mapping and canonical delegation. |
| **Manual upgrade evidence (2026-09-25)** | Seeded the existing iOS simulator installation with task `WP2.1 upgrade task` and habit `WP2.1 upgrade habit`, installed the rebuilt Release app over it, launched it, and confirmed both exact records remained visible. The Settings/App Preferences surface and its persisted controls remained available after upgrade. Physical-device evidence remains unavailable and is still tracked under the provisional G1 acceptance; simulator evidence is not represented as physical-device acceptance. |
| **Data preservation** | Existing canonical namespaces and keys are preserved. No migration deletes a source record, no incompatible collections are blindly merged, and no new database or persistence framework was introduced. |
| **Status** | **Verified** |
| **Gate effect** | WP2.1 is satisfied. **WP2.2 has not begun.** Phase 2 remains active. Final G1 physical-device evidence is still required before G8 release qualification. |

---

## WP2.2 - Verified

WP2.2 is complete. Every active local domain now has a versioned schema and strict load validation; invalid or incompatible data produces an actionable recovery state, remains preserved, and cannot be converted into an empty-state overwrite.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP2.2 — Add validated schemas and corrupted-data recovery** |
| **Dependency gate** | WP2.1 was verified before implementation in this record and in `.project-continuity/state.json`. Canonical ownership and key precedence were retained. |
| **Schema coverage** | Added version-1 envelopes and domain validators for tasks, habits, settings, onboarding, brain dump, reminders, reminder settings and daily planning. The executable registry and recovery contract are documented in [local-data-schema-recovery.md](/Users/echoin.ink/Developer/lumo/docs/local-data-schema-recovery.md). |
| **Failure classification** | Loads distinguish absent/valid-empty data, unreadable storage, malformed JSON or invalid shape/fields, unsupported schema versions, migration failure and interrupted migration. Collections validate atomically before becoming application state. |
| **Preservation and migration** | Existing valid unversioned records migrate in place only after their exact raw value is copied to a domain recovery key. Migration uses a marker plus read-back verification. Invalid/current-future records are never rewritten during load, and interrupted markers become actionable errors. |
| **Destructive-write guard** | Every domain save performs the same validated load first. A failed load therefore cannot fall through to a default/empty save. Explicit fresh-start recovery archives the exact invalid raw value and resets only the selected domain; namespace-wide clearing is not used. |
| **Hydration and recovery UI** | The root data gate eagerly hydrates all active domains and renders routes only after all settle. Failures reuse `RecoverySheet` with a non-mutating retry and, where the raw value is readable, an explicit domain-only archive/reset decision. Unreadable storage offers retry only. |
| **Automated checks (2026-09-25)** | TypeScript passed; tests **124 passed, 0 failed**; lint **0 errors, 86 existing warnings**; Expo Doctor **20/20**; credential-free config validation passed; web export passed; iOS Hermes production export passed; Android Hermes production export passed; `git diff --check` passed. Tests cover malformed JSON, wrong JSON shape, invalid fields, unknown schema versions, unreadable storage, migration failure, interrupted migration, failed-load write blocking, raw-data archiving and unaffected-domain preservation. |
| **Manual verification** | Served the production web export locally and confirmed a clean installation reached Dashboard after the new all-domain hydration gate with no browser console errors. Corruption and recovery decisions were exercised deterministically through raw-storage fixtures; no physical-device corruption injection is claimed. |
| **Scope preserved** | No SQLite/database framework, storage key replacement, screen redesign, cross-domain reset, or WP2.3 mutation-serialization work was introduced. WP2.4 date semantics remain unchanged. |
| **Status** | **Verified** |
| **Gate effect** | WP2.2 is satisfied. **WP2.3 has not begun.** Phase 2 remains active. |

---

## WP2.3 - Verified

WP2.3 is complete. Active task and habit mutations now report success only after the validated local write returns, conflicting read-modify-write operations are serialized, failures reject through the store and hook layers, and forms remain open with retryable feedback when persistence fails.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP2.3 — Standardize durable mutations and serialize conflicting writes** |
| **Dependency gate** | WP2.1–WP2.2 were verified before implementation. Canonical ownership, existing keys, schema envelopes, recovery guards and domain-only recovery behavior were preserved. |
| **Mutation contract** | Added a shared `DurableMutationResult<T>` success contract and classified `DurableMutationError` (`not-found`, `conflict`, `write-failed`). Task and habit store/hook actions return a saved result only after repository persistence completes and reject failures to their caller. |
| **Serialization and conflicts** | Task and habit repositories use non-poisoning per-domain promise queues around every read-modify-write mutation. Each queued operation reloads the latest validated record before applying its change. Reads wait for queued writes; habit tombstones remain in the full stored collection; an update queued after deletion rejects as a conflict and cannot resurrect the entity. |
| **UI durability** | Task and habit stores are durable-first: memory changes only after local persistence succeeds, so failed writes leave the last saved state intact. Active task/habit forms await the durable result, suppress duplicate submissions synchronously, stay open on failure, display inline retry guidance and cannot be dismissed while a write is in flight. Non-form failures are surfaced by task/habit error banners. Task toggles and habit completion interactions coalesce duplicate in-flight taps. |
| **Dependent active flows** | Routine-bundle task creation is awaited before showing applied state. Brain-dump and morning-planning task conversions wait for the durable task result before recording the destination identifier. Persistence remains in repositories/stores rather than UI components. |
| **Automated checks (2026-09-25)** | Credential-free config validation passed; TypeScript passed; tests **130 passed, 0 failed**; lint **0 errors, 84 existing warnings**; Expo Doctor **20/20**; web export passed; iOS Hermes production export passed; Android Hermes production export passed; `git diff --check` passed. New tests cover concurrent creates, overlapping partial edits, simultaneous completion dates, delete/update conflict ordering, injected write failure, memory rollback, retry, duplicate taps/submissions and restart hydration after a failed operation. |
| **Failure/restart evidence** | The deterministic storage-failure test injects a task write exception, verifies that the store retains the prior durable value, clears memory to simulate restart, rehydrates the same prior value from storage, then removes the fault and verifies the retry is saved. This is automated local-storage evidence; no physical-device failure injection is claimed. |
| **Scope preserved** | No database replacement, storage-key migration, optimistic unsaved-state model, sync protocol redesign, screen redesign or WP2.4 local-date work was introduced. Expo SDK 55 versioned documentation was reviewed before implementation. |
| **Status** | **Verified** |
| **Gate effect** | WP2.3 is satisfied. **WP2.4 has not begun.** Phase 2 remains active. |

---

## WP2.4 - Implementation complete; automated acceptance verified

WP2.4 is implemented. Tasks, calendar, habits, planning, dashboard suggestions and reminder presets now share one explicit local date/time policy; local days are no longer derived by slicing UTC timestamp strings; and mounted day-dependent state refreshes at local midnight and whenever the app returns to the foreground.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP2.4 — Define local date/time semantics** |
| **Dependency gate** | WP2.2 was verified before implementation. Existing storage keys, schema envelopes, recovery guards and valid stored values were retained. Expo SDK 55 versioned documentation was reviewed before code changes. |
| **Policy and representations** | [local-date-time-policy.md](/Users/echoin.ink/Developer/lumo/docs/local-date-time-policy.md) defines separate local date keys (`YYYY-MM-DD`), wall-clock times (`HH:mm`) and absolute timestamp instants (ISO 8601 with `Z` or an explicit offset). It records DST, timezone-change, month/year rollover and compatibility behavior. |
| **Shared operations** | Added branded representation types and shared validation, formatting, local-day extraction, calendar-day/month arithmetic, weekday lookup, local date/time resolution and instant serialization in `src/utils/dateTime.ts`. Civil-day arithmetic never adds fixed 24-hour millisecond offsets; monthly recurrence clamps to the final valid target date. |
| **Lifecycle refresh** | `useLocalDay` and its testable lifecycle subscription refresh mounted consumers at the next local midnight and on every foreground transition. Foregrounding also re-arms the midnight timer, so manual clock, DST and timezone changes cannot leave the old boundary timer active. Same-day foregrounding still rerenders clock-dependent planning state. |
| **Affected domains** | Task filters/forms/display/parking, calendar week navigation, habit completion/weekday/streak logic, dashboard focus suggestions, daily planning rollover/carry-over, recurrence and reminder preset/due-day logic now use the shared policy. Reminder instants are converted to the current local day before classification rather than UTC-sliced. Ambiguous legacy date/time strings are neither guessed nor reinterpreted; valid existing task date/time values round-trip unchanged, and unchanged legacy form values are preserved until explicitly edited. |
| **Automated checks (2026-09-25)** | Credential-free config validation passed; TypeScript passed; tests **144 passed, 0 failed**; lint **0 errors, 84 existing warnings**; Expo Doctor **20/20**; web export passed; iOS Hermes production export passed; Android Hermes production export passed; `git diff --check` passed. Repository scans found no remaining `toISOString().split/slice` local-day derivation, fixed 86,400,000 millisecond day movement, due-date parsing as timestamp instants, or reminder timestamp slicing in `app/` or `src/`. |
| **Boundary coverage** | Tests cover Auckland summer and winter midnight boundaries, UTC+14 and UTC-8 dates, Auckland DST start/end, local midnight refresh, foreground refresh, timezone changes while backgrounded, month/year/leap rollover, month-end clamping, reminder instant classification and preservation of stored valid local date/wall-time values. |
| **Native verification (2026-09-28)** | On the iPhone 17 Pro / iOS 26.5 simulator, Lumo was relaunched with a native process timezone override from `Pacific/Auckland` to `Pacific/Honolulu`, moving the active local day from 2026-09-28 to 2026-09-27. Health refreshed from 420 kcal / 153.5 lb to the prior-day 0 kcal / 156 lb state without retaining stale current-day values. Lumo was backgrounded by opening Settings and resumed in the same process; the 2026-09-27 state remained correct. The app was then terminated and relaunched in `Pacific/Auckland`, restoring the 2026-09-28 values. iOS 26.5 Simulator did not expose a Date & Time settings screen, so no independent wall-clock edit is claimed; automated lifecycle tests retain deterministic clock/midnight coverage. The simulator timezone was restored to `Pacific/Auckland`. |
| **Scope preserved** | No storage key or schema-version migration, database replacement, notification delivery/reconciliation implementation, arbitrary-date picker expansion, sync protocol change or WP2.5 shared-planning-store work was introduced. |
| **Status** | **Complete; automated and native acceptance verified.** |
| **Gate effect** | WP2.4 is satisfied. WP2.5 completion is recorded below. |

---

## WP2.5 - Implementation complete; automated acceptance verified

WP2.5 is implemented. Daily planning now uses a shared planning store over the existing planning service, parking metadata is durable and separate from daily summary state, and selected planning steps are resolved by stable source identity instead of recommendation-list position.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP2.5 — Create shared planning state and durable parking** |
| **Dependency gate** | WP2.1–WP2.4 were verified or implementation-complete before this work. Existing task, habit, reminder and brain-dump ownership remains canonical in their own stores. Expo SDK 55 versioned documentation was reviewed before implementation. |
| **Audit coverage** | Addresses **B11** and the Phase 2 portion of **B12** by removing independent mounted daily-planning snapshots and moving parking out of day-scoped summary fields. WP3.4 remains responsible for later planning-core refinements beyond the shared-state and durable-parking contract. |
| **Shared planning state** | Added `usePlanningStore` as the small shared store over `planningStorage`. Dashboard, Morning Planning, Evening Planning and Parked consume the same summary/parking state, and store updates use functional persistence updates so mounted subscribers observe changes without stale overwrite behavior. |
| **Durable parking metadata** | Added a separate validated `planning-parking` versioned storage domain under `StorageKeys.PLANNING_PARKING`. Parking records store source type, source id, parking time, source flow and original due-date metadata where applicable. Daily summary rollover resets day-scoped fields while preserving parked records. Legacy `parkedIds` and `eveningParkedIds` are migrated into durable parking on load without deleting the old summary. |
| **Canonical source records** | Planning stores stable source references, not duplicated task/habit/reminder/brain-dump records. Tasks remain canonical in `useTaskStore`/`taskLocalRepository`; habits remain canonical in `useHabitStore`/`habitLocalRepository`; reminders and brain-dump entries remain in their existing stores. Routine planning suggestions now use habit IDs when available instead of title-only identity. |
| **Selection stability** | Morning-plan selection records `nextStepRef` and resolves selected steps from a full candidate list, so a chosen task/reminder/routine/brain-dump source can remain selected even when the visible recommendation order changes or the item falls outside the top-three shortlist. |
| **Deleted source safety** | Parked records are resolved against canonical stores at render time. Missing/deleted sources render as removable stale parked refs rather than crashing, duplicating records or resurrecting source entities. Restore/remove operations can clear a durable parking ref without requiring the source record to still exist. |
| **Parking and restore behavior** | Parking a task writes durable parking metadata and moves its due date out; bringing it back clears the parking record and restores the task to the current local day. Parking brain-dump entries archives them through the brain-dump store and restoration clears planning parking while restoring the source entry when present. |
| **Automated checks (2026-09-25)** | TypeScript passed; tests **153 passed, 0 failed**; lint **0 errors, 83 existing warnings**; `git diff --check` passed. New tests cover multiple planning-store subscribers, simultaneous functional updates, rollover, restart hydration, legacy parking migration, deleted source refs, recommendation-rank changes and parking/restore persistence. |
| **Native verification (2026-09-28)** | Navigated Dashboard → Morning Planning, selected Medium energy and `WP2.1 upgrade task`, completed the plan, edited the canonical task to `WP2.1 upgrade task planned`, and confirmed Evening Planning immediately showed the edited title. Parked the task, verified it in Parked, restored it, and verified Parked became empty. After terminate/relaunch, the edited task and shared planning state persisted. Representative task, off-day habit and Settings preference state also persisted across native restart. |
| **Scope preserved** | No database replacement, storage-key rewrite for existing daily summaries, task/habit source-record duplication, screen redesign, cloud/sync behavior, notification delivery, recurrence repair or WP3.4 planning-core expansion was introduced. |
| **Status** | **Complete; automated and native acceptance verified.** |
| **Gate effect** | WP2.5 and its cross-screen/restart acceptance are satisfied. |

---

## WP2.6 - Verified

WP2.6 is complete. Shared UI primitives now compose caller styles with their required foundations, deliberately preserve interaction and accessibility semantics, and use readable essential colour pairs without changing feature-specific layouts.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP2.6 — Repair shared UI contracts** |
| **Dependency gate** | WP2.1–WP2.5 were complete or implementation-complete before this work. Expo SDK 55 versioned reference and haptics documentation were reviewed before implementation. |
| **Card and Button contracts** | Card and Button now extract caller style before forwarding props and compose base, caller and required invariant layers. Pressable Cards forward supported view/touch props, long press, disabled state, caller class/style and accessibility state. Buttons forward supported touch props while retaining their press handler, role, disabled/loading state, layout and a non-overridable 44×44 minimum target. Caller selected/expanded/checked state is retained when required disabled/busy state is merged. |
| **Labels, state and errors** | Button continues deriving a label from string children unless a caller supplies one. Input derives a stable native identifier and label from its field label, preserves caller focus/blur callbacks, exposes invalid state and error guidance, and announces visible errors politely. ProgressBar supplies a progressbar role, label and clamped 0–100 value. Screen no longer assigns the incorrect adjustable role and composes caller styles/content-container styles. Text required no contract change. |
| **Contrast** | The primary, danger, tertiary-text and text-bearing gradient endpoints were darkened within Lumo's purple/pink/navy identity. Secondary buttons now use dark foreground text. Regression calculations require at least 4.5:1 for normal-size text on every shared essential pair. Decorative pastel tokens remain available. |
| **Automated checks (2026-09-25)** | Credential-free config validation passed; TypeScript passed; tests **158 passed, 0 failed**; lint **0 errors, 83 existing warnings**; Expo Doctor **20/20**; web export passed; iOS Hermes production export passed; Android Hermes production export passed; `git diff --check` passed. Five new primitive tests cover style layering, the enforced minimum target, merged selected/disabled/busy state, clamped progress semantics and contrast pairs. |
| **Manual verification** | Inspected exported Dashboard, Tasks and More at a 320×568 viewport: primitive spacing/radii remained intact, horizontal filters remained scrollable, controls remained labeled, selected tabs/filters exposed state and ProgressBar appeared as a progress indicator. Installed the existing Release simulator build on the booted iPhone 17 Pro, set Dynamic Type to XXXL, relaunched and inspected Dashboard: text wrapped, Cards retained spacing, primary/secondary controls retained their targets and the screen remained vertically scrollable. The simulator text size was restored to its original Large setting. This is simulator evidence, not physical-device acceptance. |
| **Scope preserved** | No screen redesign, feature-specific layout consolidation, storage behavior, navigation structure, haptics preference wiring or Phase 3 work was introduced. |
| **Status** | **Verified** |
| **Gate effect** | WP2.6 and the Card/Button regression criterion are satisfied. The remaining G2 native/manual evidence was completed on 2026-09-28. |

## G2 Phase Acceptance Gate - PASS

**PASS.** WP2.4's native local-day/timezone background-resume sequence refreshed mounted day-dependent state and the simulator timezone was restored. WP2.5's Dashboard → Morning Planning → Evening Planning → Parked → restore sequence used shared canonical state and survived terminate/relaunch. Representative Tasks, Habits and Preferences state also survived native restart. This is iOS simulator evidence, not physical-device evidence.

---

## WP3.1 - Verified

WP3.1 is complete. Every supported user-editable task field now round-trips through the canonical store/repository, arbitrary valid dates are editable, schedule validation is shared by UI and persistence, success waits for durable writes, and date filters use one explicit local-day contract.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP3.1 — Complete task CRUD, dates and times** |
| **Dependency context** | G2 retains the previously recorded manual evidence gaps. The product owner explicitly authorized this bounded WP3.1 package on 2026-09-27. No WP3.2 or later Phase 3 work was started. |
| **Field round-trip** | The canonical local repository now validates and preserves title, description, priority, energy, recurrence, arbitrary local due date and wall-clock due time on create/edit/restart. The form opens non-preset dates as an explicit Choose date selection instead of mapping them to No date. Today, Tomorrow and No date remain shortcuts. |
| **Schedule validation** | New/changed dates must be real `YYYY-MM-DD` calendar dates; new/changed times must be 24-hour `HH:mm`; a time requires a date; selecting No date clears the submitted time. Validation is repeated in `taskLocalRepository`, returning the durable `invalid-input` failure contract to every caller. Unchanged ambiguous legacy values remain preservable under the existing compatibility policy. |
| **Durable UI behavior** | The canonical form, compatibility add modal and Quick Capture task path await the task mutation before clearing or closing. Failed writes retain entered Quick Capture text or the open form for retry, while durable-first stores leave in-memory state at the last saved value. |
| **Date-filter contract** | Today contains active overdue, due-today and undated tasks. Upcoming contains only active tasks strictly after today. Done contains every completed task regardless of date. All contains every non-deleted task. Completed work is excluded from Today and Upcoming. The contract is documented in [local-date-time-policy.md](/Users/echoin.ink/Developer/lumo/docs/local-date-time-policy.md). |
| **Compact CRUD actions** | Full task metadata exposed a native compact-width regression that pushed Delete off-card. The task content now shrinks within the row while edit/delete actions remain visible; the rebuilt iPhone 17 Pro simulator showed both actions and opened the native Delete/Park/Cancel confirmation. |
| **Automated checks (2026-09-27)** | Credential-free config validation passed; TypeScript passed; tests **163 passed, 0 failed**; lint **0 errors, 80 existing warnings**; Expo Doctor **20/20**; web export passed; iOS Hermes production export passed; Android Hermes production export passed; iOS Release simulator compilation/install passed twice (initial and compact-layout verification); `git diff --check` passed. Five focused WP3.1 tests cover complete create/edit/restart round-trip, arbitrary-date form preservation, invalid date/time rejection, injected failed create plus retry, and Today/Upcoming/Done/All boundaries. Existing tests cover toggle serialization and soft deletion. |
| **Manual verification** | Production web: created a task with custom date/time, priority, energy, recurrence and notes; rejected an invalid time; edited title without changing the schedule; completed and undid it; created via Quick Capture; reloaded from a fresh root navigation; and confirmed both tasks and their filter placement persisted. Updated iOS Release simulator: created and edited a custom-date/time task with priority, energy and recurrence; completed and undid it; created through Quick Capture; terminated and relaunched the process; confirmed the undated task in Today and scheduled task in Upcoming with all edited fields still populated. After explicit confirmation, deleted the scheduled test task through the native Delete/Park/Cancel prompt, confirmed Upcoming became empty, terminated and relaunched again, and confirmed the deleted task remained absent while the Quick Capture task persisted. Simulator evidence is not physical-device evidence. |
| **Architecture and scope** | Task ownership remains `useTaskStore` → `taskLocalRepository` → existing versioned storage. No project, tag, subtask, cloud-sync, recurrence-execution or later Phase 3 functionality was added. The unrelated concurrent edits in `lumo-launch-master-implementation-plan.md` were not modified by this work. |
| **Status** | **Verified** |
| **Gate effect** | WP3.1 Definition of Done is satisfied. **WP3.2 has not begun.** Phase 3 remains active. |

---

## WP3.2 - Verified

WP3.2 is complete. Every recurrence option exposed by the task form now advances exactly once, completed occurrences remain durable history, restart and retry are idempotent, and missed schedules create only the first future occurrence rather than a backlog.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP3.2 — Execute task recurrence** |
| **Dependency context** | WP3.1 is verified. G2 retains its previously recorded manual evidence gaps; the product owner explicitly authorized this bounded WP3.2 package on 2026-09-27. No WP3.3 or later Phase 3 work was started. |
| **Identity model** | Recurring tasks use optional `seriesId`, zero-based `occurrenceIndex`, `recurrenceAnchorDate`, `previousOccurrenceId` and `nextOccurrenceId` fields. The predecessor/successor link is the durable idempotency key: a completion retry or restart reuses the existing successor rather than creating another record. Existing non-recurring and legacy tasks remain schema-compatible. |
| **Completion and history** | Completing an active recurring occurrence atomically marks that record complete with `completedAt` and persists one incomplete successor. The completed record remains in Done as history. Repeated explicit completion is a no-op; in-flight repeated UI taps share one mutation. Undo reopens the historical occurrence but retains its already-created successor and any successor edits; recompleting relinks to that same successor without duplication. Editing an occurrence affects that occurrence, and its recurrence settings become the source copied to its eventual successor. |
| **Cadence and backlog policy** | The corrected recurrence utility uses local civil-date arithmetic for daily, weekday, weekly and multi-week intervals. Monthly calculation retains the series anchor, so January 31 can clamp to February 28/29 and return to March 31. Completing an overdue task skips missed dates and creates only the first occurrence after the current local day. Wall-clock due time is preserved, avoiding fixed-24-hour DST drift. |
| **Automated checks (2026-09-27)** | Credential-free config validation passed; TypeScript passed; tests **168 passed, 0 failed**; lint **0 errors, 80 existing warnings**; Expo Doctor **20/20**; web export passed; iOS Hermes production export passed; Android Hermes production export passed; `git diff --check` passed. Five focused WP3.2 tests cover daily/weekly/monthly cadence, daily/weekly/monthly intervals, selected weekdays, month-end, leap years, DST boundaries, missed-date backlog suppression, repeated completion, repeated taps, stable series identity, completion history, successor-only edits, undo/recompletion and restart persistence. |
| **Manual verification** | Production web export: created a daily task due Today, completed it and confirmed exactly one Tomorrow occurrence; edited the generated successor; reloaded from a fresh root navigation and confirmed the edit and both occurrences persisted; then undid the original completion and confirmed the original reopened while the edited successor remained and no duplicate appeared. This browser check is not physical-device evidence. |
| **Architecture and scope** | Task ownership remains `useTaskStore` → `taskLocalRepository` → existing versioned storage. No background scheduler, backlog materializer, cloud recurrence service, habit work or WP3.3 functionality was introduced. The unrelated pre-existing edit in `lumo-launch-master-implementation-plan.md` was not modified by this work. |
| **Status** | **Verified** |
| **Gate effect** | WP3.2 Definition of Done is satisfied. Phase 3 remains active; **WP3.3 has not begun.** |

---

## WP3.3 - Implementation complete; automated acceptance verified

WP3.3 is implemented. Every active habit is exposed through one all-habits management section regardless of today's schedule, completion history is shown as persisted local dates, and current and historical-best streaks are derived from the canonical dated records using each habit's schedule.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP3.3 — Complete habit management and history** |
| **Dependency context** | **WP3.2 remains Verified** with 168 passing tests and its recorded browser recurrence check. G2 retains the previously recorded manual evidence gaps. The product owner explicitly authorized this bounded WP3.3 package on 2026-09-27. Expo SDK 55 versioned documentation was reviewed before code changes. No WP3.4 or later Phase 3 work was started. |
| **Management and history** | The routed More → Habits screen retains today's actionable list and adds **Manage all habits**, sourced from the canonical habit store so off-day weekly habits remain editable, inspectable and deletable. Each row can reveal a simple newest-first list of unique valid persisted completion dates plus its historical best. Off-day rows cannot create an off-schedule completion. |
| **Truthful streak semantics** | Added shared habit-history selectors. A current streak counts consecutive scheduled completions, ignores unscheduled calendar gaps, stops at a missed scheduled day, and remains active through an unfinished current scheduled day when the previous scheduled occurrence was completed. Historical best is the longest completed scheduled run anywhere in persisted history, independent of the current run. UI metrics derive on every canonical-store or local-day refresh rather than trusting stored `streakCount`, eliminating midnight/resume staleness. |
| **Validation and mutation safety** | Weekly create/update now requires at least one unique valid weekday in both the form and canonical repository. Completion writes require a valid scheduled local date. The existing serialized repository queue remains the single read-modify-write path; identical in-flight completion actions are deduplicated while complete and undo operations retain distinct ordering keys. No second history or statistics store was introduced. |
| **Deletion recovery** | Deletion is soft and requires a destructive confirmation. After a successful durable delete, the screen exposes an immediate Undo action; canonical `restoreHabit` clears the deletion marker while retaining the habit's dated history, sync metadata progression and restart durability. Failed delete/restore writes leave the existing error and retry path visible. |
| **Automated checks (2026-09-27)** | Credential-free config validation passed; TypeScript passed; tests **176 passed, 0 failed**; lint **0 errors, 77 existing warnings**; production web export passed; `git diff --check` passed. WP3.3 coverage includes scheduled/off days, missed scheduled days, yesterday-only current streak, historical best, unique dated history, weekly-day rejection, completion undo, repeated completion idempotency, concurrent different-date completion retention, deletion recovery and fresh repository reads after persistence. |
| **Native verification (2026-09-28)** | Edited `WP2.1 upgrade habit` into the Tuesday-only `WP3 off-day habit` while the simulator local day was Monday; it correctly disappeared from Today but remained editable in Manage all habits. Opened its history, deleted it, restored it through Undo, terminated/relaunched, and confirmed the off-day canonical record and history state persisted. The remaining missed-day/resume scenario was then closed with a separate daily fixture, `G3 missed-day acceptance`: completed Sunday 2026-09-27, advanced past an uncompleted required Monday 2026-09-28, resumed and completed Tuesday 2026-09-29, and confirmed a one-day current streak, historical best of one scheduled completion, and canonical history containing exactly Sep 27 and Sep 29. The absent Sep 28 record broke the streak correctly. After terminate/relaunch on the simulated Sep 29 day, the one-day current streak and both dated history records persisted. Restoring normal Auckland time displayed the canonical Sep 27/Sep 29 dates and the simulator clock was confirmed as Monday 2026-09-28 NZDT. The 232-test suite separately retains scheduled/off-day gap, missed-day, history and deletion-recovery coverage. |
| **Architecture and scope** | Habit ownership remains `useHabitStore` → `habitLocalRepository` → existing versioned habit storage with `completedDates` as the only history source. No schema fork, second statistics source, cloud sync expansion, broad Health redesign, or WP3.4 planning work was introduced. The unrelated pre-existing untracked `assets/branding/` and `docs/brand/` content was not modified. |
| **Status** | **Complete; automated and simulator-native habit acceptance verified.** |
| **Gate effect** | WP3.3 implementation and automated Definition of Done are satisfied. Phase 3 remains active. **WP3.4 has not begun.** |

---

## WP3.4 - Implementation complete; automated acceptance verified

WP3.4 is implemented. Morning planning, evening review, Dashboard and Parked Items now retain one shared persisted intention model while resolving every source from its canonical task, habit, reminder or Brain Dump store.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP3.4 — Complete planning and recovery behavior** |
| **Dependency context** | WP2.5 and WP3.1–WP3.3 were complete or implementation-complete before this package. G2 and WP3.3 retain their previously recorded manual/native evidence gaps. Expo SDK 55 versioned Router and persistent-storage documentation was reviewed before code changes. |
| **Parking return contract** | A parked task records its exact prior schedule, including an explicit `null` marker for an intentionally undated task. Parking still moves the task out of the active horizon, but Bring back durably restores the captured due date (or undated state) before removing the parking record. Legacy parking without captured metadata retains the safe current-day fallback. Failed task parking removes the new parking ref; failed restoration leaves the parked intention available to retry. Parking metadata survives day rollover and restart. |
| **Recommendation correctness** | Low-energy task choices now require explicit low energy; due-ness, no date and low priority no longer relabel high/unknown-effort work as tiny. Completed habits are excluded by building routine anchors from today's pending habits. Selected next steps continue resolving by stable source type/id from the uncapped candidate set, independent of visible ranking changes. |
| **Truthful counts and shared surfaces** | Visible carry-over, Brain Dump and recommendation lists remain capped for calm presentation, while Dashboard and completion summaries receive uncapped remaining-backlog counts. Every planning surface uses `usePlanningStore`; mounted subscribers receive the same functional persisted updates. Canonical tasks/habits/reminders/Brain Dump records remain in their existing stores and planning retains only refs plus recovery metadata. Missing refs remain safely removable. |
| **Automated checks (2026-09-27)** | Credential-free config validation passed; TypeScript passed; the combined WP3.4/WP3.5 suite finished at **183 passed, 0 failed**; lint **0 errors, 77 existing warnings**; Expo Doctor **20/20**; production web export passed; iOS Hermes production export passed; Android Hermes production export passed; `git diff --check` passed. Focused planning coverage includes multiple subscribers, functional simultaneous updates, rollover/restart parking, deleted refs, ranking changes beyond the visible cap, low-energy exclusion and explicit undated return metadata. Existing planning coverage retains visible caps, reminders, local-day boundaries and persisted summaries. |
| **Manual verification** | Production web export: opened Dashboard → Morning Planning, selected Low energy and confirmed the rendered choice was an explicitly low-energy task. Dashboard, Brain Dump and Morning Planning navigation all rendered from the same persisted browser state. The full required native Morning → task edit → Evening → Parked → restore → process-restart sequence was not performed; automated persistence/restart coverage is not represented as native-device evidence. |
| **Architecture and scope** | No canonical entity was copied into planning, no storage key was replaced, and no new database, cloud state, screen redesign or later Phase 3 behavior was introduced. The unrelated untracked branding asset was not modified. |
| **Status** | **Implementation complete; automated acceptance verified; native manual sequence pending.** |
| **Gate effect** | WP3.4 implementation and automated Definition of Done are satisfied. WP3.5 was begun only after the WP3.4 implementation and focused checks passed. Phase 3 remains active. |

---

## WP3.5 - Implementation complete; automated acceptance verified

WP3.5 is implemented. Capture conversion now records a stable retry identity before destination creation, marks a source converted only after its canonical destination is durable, and keeps interrupted or failed sources actionable.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP3.5 — Make capture and conversion durable** |
| **Dependency context** | WP2.3, WP3.1 and WP3.4 implementation were complete before this package. Existing Brain Dump, task, reminder, Quick Capture and routine-bundle architecture was retained. |
| **Recoverable conversion operation** | Brain Dump stores a stable conversion identity and pending target on the source before creating a task/reminder. Task and reminder creation recognize that identity and return the existing canonical destination on retry. Only after destination persistence succeeds is the source marked converted and linked to the destination. A destination failure leaves the source open; interruption after destination save is retry-safe and resolves to exactly one destination; a pending operation cannot silently switch target types. |
| **Capture and notes** | Brain Dump entries can be edited with persistence across reload/restart. Routine ideas remain visible in a dedicated editable Brain Dump notes section instead of disappearing from accessible UI. Quick Capture now treats a null task/reminder/note result as failure and retains the entered text for retry. Brain Dump writes persist before updating memory, so a failed write cannot present unsaved success. |
| **Routine bundle durability** | Empty edited bundles are disabled in UI and rejected by the conversion helper instead of reporting false success. Each bundle item has a stable operation identity stored on its canonical task. Duplicate taps, partial failure, retry and restart reuse existing items and create only missing tasks; a fully applied starter bundle remains visibly applied after hydration. |
| **Automated checks (2026-09-27)** | Credential-free config validation passed; TypeScript passed; tests **183 passed, 0 failed**; lint **0 errors, 77 existing warnings**; Expo Doctor **20/20**; production web export passed; iOS Hermes production export passed; Android Hermes production export passed; `git diff --check` passed. Focused tests cover destination failure, interrupted source completion, retry identity, exactly-one destination, pending-operation restart, Brain Dump edit persistence, empty bundles and partial-bundle restart/retry idempotency. |
| **Manual verification** | Production web export: captured a Brain Dump thought, edited and saved it, converted it to a routine idea, returned through a fresh root navigation, and confirmed the exact edited note remained visible and editable under Routine ideas. The exported static server returned 404 when directly refreshing a client route, so restart was verified by re-entering from `/`; this is browser-local persistence evidence, not native process-restart evidence. Failure injection and duplicate-tap behavior were verified deterministically in tests rather than through UI. |
| **Architecture and scope** | Canonical destinations remain in `useTaskStore`/`taskLocalRepository` and `useReminderStore`; Brain Dump holds source state and identity metadata only. The implementation uses small local idempotency records, not a transaction framework or duplicate destination store. No notification delivery, routine entity model, cloud sync expansion or WP3.6 work was introduced. |
| **Status** | **Implementation complete; automated acceptance verified; native manual interruption/restart sequence pending.** |
| **Gate effect** | WP3.5 implementation and automated Definition of Done are satisfied. Phase 3 remains active. **WP3.6 has not begun.** |

---

## WP3.6 - Implementation complete; automated and browser acceptance verified

WP3.6 is implemented. Calendar is an actionable view over the canonical task store: selected-date creation, editing, completion, deletion, movement, ordering and restart all use the same durable records as Tasks.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP3.6 — Complete task-backed calendar interactions** |
| **Canonical interactions** | Calendar creates through `TaskFormModal` with the selected local date prefilled, edits through canonical `updateTask`, completes through canonical recurrence-aware `toggleTask`, and deletes through canonical soft deletion. There is no event store or system-calendar integration. Mounted Calendar and Tasks subscribe to the same Zustand task store, so changes are immediate. |
| **Ordering and navigation** | Valid timed tasks sort chronologically before untimed work with stable created/id fallback ordering. Previous/next week and day selection remain intact. The dead calendar control now selects today and resets the visible week. |
| **Automated checks (2026-09-27)** | Focused tests cover selected-date filtering, deletion, chronological timed ordering, date movement and deletion after movement. The final integrated suite passed **189 tests, 0 failed**. TypeScript, config validation and `git diff --check` passed. |
| **Manual verification** | Production web: completed onboarding, advanced one week, created a 09:15 task from Calendar for the selected date, opened Tasks and confirmed it in Upcoming, edited its title in Tasks, returned to Calendar and saw the edit immediately, completed it in Calendar, re-entered through a fresh root load and confirmed the completed canonical task remained on that date. Direct refresh of a client route returned the expected static-server 404, so restart was verified by fresh root entry. This is browser-local persistence evidence, not native process-restart evidence. |
| **Status** | **Implementation complete; automated and browser acceptance verified; native process-restart sequence pending.** |
| **Gate effect** | WP3.6 implementation and browser Definition of Done are satisfied. Native restart evidence remains part of G3. |

---

## WP3.7 - Implementation complete; automated and browser acceptance verified

WP3.7 is implemented. First-run routing is hydration-aware, onboarding completion is durable-first, and the remaining production preferences have observable effects through one canonical settings store.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP3.7 — Apply onboarding and preferences** |
| **Onboarding lifecycle** | The root gate evaluates canonical onboarding state only after `ActiveLocalDataGate` finishes hydration. Incomplete users are sent to the routed onboarding flow; interrupted onboarding routes remain usable; completed users cannot re-enter the first-run flow. Completion persists before navigation. The Minimal planning choice initializes canonical Simplified Mode and the retained overwhelm selection supplies real supportive Dashboard copy. |
| **Preferences** | Shared Button, IconButton, FloatingActionButton and haptic utilities now read the canonical settings haptic preference. The shared reduced-motion hook combines the OS preference with canonical settings and shared controls consume it. Simplified Mode removes secondary Dashboard summary/progress and secondary More destinations while preserving Today's Focus, capture, Calendar, planning, parked work and Settings. Unsupported Profile, Dark Mode, Privacy and production Testing controls were removed. |
| **Automated checks (2026-09-27)** | Routing tests cover fresh install, interrupted onboarding, completed restart and product-route preservation. The final integrated suite passed **189 tests, 0 failed**; TypeScript and lint passed with **0 errors, 76 existing warnings**. |
| **Manual verification** | Production web: fresh storage entered onboarding; selected Feeling overwhelmed, Minimal and Tasks; completed onboarding; verified the personalized Dashboard copy and reduced presentation; reloaded from root and remained completed; opened More and confirmed only core destinations; disabled Simplified Mode in Settings and immediately saw the full More presentation return. Native haptic output and native reduced-motion transitions were not physically verified. |
| **Status** | **Implementation complete; automated and browser acceptance verified; native sensory verification pending.** |
| **Gate effect** | WP3.7 implementation is complete. Native haptic/reduced-motion evidence remains part of G3. |

---

## WP3.8 - Implementation complete; automated acceptance verified

WP3.8 is implemented. Obsolete production URLs no longer expose starter, mock, blank or dead-end content.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP3.8 — Retire obsolete production routes and repair navigation** |
| **Retired routes** | Expo Explore and the mock weekly Dashboard intentionally redirect to the supported Dashboard. The blank Add tab and dead Add modal redirect to Tasks. Useful source modules outside the active route graph were preserved. |
| **Navigation fallbacks** | `ScreenBackButton` already supplied history-aware fallback routing. More subpage headers now fall back to More on cold entry, and cold onboarding Planning/Focus back actions fall back to their preceding supported onboarding route. |
| **Automated checks (2026-09-27)** | Route scans verify required routes, local-release auth isolation, intentional redirects, absence of dead TODO route content and absence of unsupported Settings controls. The final integrated suite passed **189 tests, 0 failed**. |
| **Status** | **Implementation complete; automated acceptance verified; native cold-link/back sequence pending.** |
| **Gate effect** | WP3.8 implementation is complete. No Phase 4 work was started. |

---

## G3 Phase Acceptance Gate - PARTIAL

Phase 3 implementation is complete through WP3.8 and all simulator-observable native/manual acceptance passed on 2026-09-28. G3 remains **PARTIAL** only because tactile haptic suppression cannot be physically observed on Simulator.

| Field | Record |
|---|---|
| **Automated evidence (2026-09-27)** | Credential-free native config validation passed; TypeScript passed; tests **189 passed, 0 failed**; lint **0 errors, 76 warnings**; Expo Doctor **20/20** after a network-enabled rerun (the sandboxed attempt failed only with `ENOTFOUND registry.npmjs.org`); web export passed; iOS Hermes production export passed; Android Hermes production export passed; `git diff --check` passed. |
| **Integrated browser evidence** | Fresh/interrupted/completed onboarding, completion reload, applied onboarding presentation, Simplified Mode on/off, Calendar selected-date create → Tasks edit → Calendar completion → fresh-root persistence, week/day navigation and Today action were verified in the production web export. Static hosting did not provide client-route fallback, so direct route refresh was not counted as cold-link acceptance. |
| **Native evidence closed (2026-09-28)** | WP3.4 passed Morning selection → task edit → Evening → Parked → restore → restart. WP3.5 converted `G3 conversion thought` into exactly one durable task and retained an actionable empty source after restart; no unsafe manual fault injection was fabricated, while the automated injected-interruption retry test passed. WP3.6 created and moved `G3 calendar task` from 2026-09-28 to 2026-09-29 and retained the canonical task after restart. WP3.7 verified app Haptics off and Reduced Motion on persisted after restart. WP3.8 exercised supported native direct routes, a no-history Back fallback, terminated-app direct entry to Payments, and terminated-app `/explore` redirect to Dashboard without obsolete content. |
| **Habit missed-day/resume evidence (2026-09-28)** | Created daily `G3 missed-day acceptance`; completed the Sep 27 scheduled occurrence; advanced across an uncompleted required Sep 28 occurrence; resumed and completed Sep 29. On Sep 29, Health showed a **1 day current streak**, history retained Sep 27 and Sep 29 with no Sep 28 completion, and **Historical best: 1 scheduled completion**. This proves the miss reset the current run, the resumed completion used the correct local date, and the prior run remained the historical best rather than being joined across the missed scheduled day. The previously verified Tuesday-only fixture remained excluded on its unscheduled days, so unscheduled gaps were not treated as misses. Terminate/relaunch retained the one-day current streak and canonical history. Normal NZDT was restored afterward. |
| **Remaining evidence gap** | Simulator UI confirms the canonical Haptics-off preference and its supported call-path contract, but tactile output cannot be physically perceived on Simulator. Physical-device haptic confirmation remains explicitly outstanding and is not represented as passed. |
| **Defect repaired** | Native inspection exposed that Settings toggle rows swallowed presses because their containing `TouchableOpacity` used a no-op handler. The row now invokes the same canonical toggle action as its Switch. A rebuilt Release app verified Haptics off, Reduced Motion on and Simplified Mode off. |
| **Result** | **PASS for simulator-observable requirements; physical-device haptic confirmation outstanding. Overall G3 remains PARTIAL.** |
| **Roadmap effect** | The roadmap permits G3 PASS only when every criterion is verified and contains no G3 physical-device deferral. The accepted device exception is expressly scoped to final G1 evidence before G8, so it cannot be silently extended to G3. |
| **Stop condition** | Phase 6 is not permitted by the governing gate sequence while overall G3 remains PARTIAL. |

---

## WP4.1 - Complete; automated and native acceptance verified

WP4.1 is complete under the owner's explicit Phase 4 authorization while G3's previously recorded native/manual gaps remain open. Cleaning is now a real local vertical slice with one canonical feature store/repository and no sample chores or duplicate task records.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP4.1 — Cleaning** |
| **Canonical domain and persistence** | `CleaningItem` owns the user's name, notes, first local date, supported task recurrence pattern, dated completion history and lifecycle metadata. `cleaningLocalRepository` is the single serialized mutation boundary over schema-versioned `StorageKeys.CLEANING`; the feature store updates memory only after durable writes. The active local-data gate hydrates and recovers Cleaning with the established domain recovery contract. |
| **CRUD, schedule and completion** | Cleaning supports create, read, edit, soft delete, completion and undo. Once/daily/weekly/monthly schedules reuse the existing civil-date recurrence service. Completion history belongs to occurrences, not duplicated tasks, and skipped days remain distinct occurrences. Weekly progress is derived from elapsed scheduled occurrences and persisted dated completions. |
| **UI and states** | The routed Cleaning screen contains no samples or disabled creation. It provides accessible 44-point actions, checkbox state/hints, add/edit/delete flows, inline validation, empty/loading/hydration/retry/save-failure states and existing Lumo Card/Button/Input/ProgressBar/Screen conventions. |
| **Automated checks (2026-09-28)** | Cleaning-focused tests cover civil recurrence, skipped days, occurrence-derived progress, CRUD, completion idempotency, undo, deletion, validation, injected save failure and hydration/restart. Integrated TypeScript passed; tests **196 passed, 0 failed** after both grouped packages; lint **0 errors, 78 warnings**; credential-free config validation passed; iOS and Android Hermes production exports passed; Release iOS simulator build succeeded; `git diff --check` passed. |
| **Native verification (2026-09-28)** | Installed the Release build on the booted iPhone 17 Pro / iOS 26.5 simulator. Created daily item **Native kitchen reset** for 2026-09-28, completed it, and observed **1 / 1** and **100%**. Terminated `com.meltmyheart.lumo`, relaunched it and reopened Cleaning; the exact item, checked occurrence, schedule date and 1/1 progress rehydrated. |
| **Status** | **COMPLETE — implementation, automated checks and native terminate/reopen verification passed.** |
| **Gate effect** | WP4.1 Definition of Done is satisfied. This allowed WP4.2 to begin within Phase 4 Prompt 1. G3 remains blocked exactly as recorded above and was not reclassified. |

---

## WP4.2 - Complete; automated and native acceptance verified

WP4.2 is complete. Meals now represents only food actually consumed. The former in-memory store and stub repository were replaced with compatibility aliases to one canonical local meal feature; planned meals remain a separate future domain.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP4.2 — Meals** |
| **Canonical domain and persistence** | `MealEntry` owns local consumed date, meal type, name, optional description, optional manually entered calories/protein/carbohydrate/fat and lifecycle metadata. `mealLocalRepository` is the serialized CRUD boundary over schema-versioned `StorageKeys.MEALS`; `useMealStore` is canonical. Legacy import paths delegate to those modules and do not retain competing state. |
| **CRUD, history and totals** | Meals supports create/read/edit/soft-delete and newest-date-first history. Date selectors use local date keys. Nutrition remains absent when the user enters none; known totals sum only persisted manual values and recalculate immediately after date/nutrition edits or deletion. No target, estimate, API or fabricated nutrition remains. |
| **UI and states** | The routed Meals screen contains no sample records, fixed 1,350 total or fabricated 1,800 target. It provides accessible add/edit/delete actions, meal-type radio choices, optional nutrition fields, history, empty/loading/hydration/retry/save-failure states and explicit copy that unknown nutrition is not guessed. |
| **Automated checks (2026-09-28)** | Meal-focused tests cover CRUD, local-date boundaries, optional nutrition, history ordering, edit/delete total recalculation, validation, injected write failure and hydration/restart. Final integrated TypeScript passed; tests **196 passed, 0 failed**; lint **0 errors, 78 warnings**; iOS and Android Hermes production exports passed; Release iOS simulator build succeeded; `git diff --check` passed. |
| **Native verification (2026-09-28)** | Installed the updated Release build on the booted iPhone 17 Pro / iOS 26.5 simulator. Logged **Native avocado toast** as Lunch on 2026-09-28 with manually entered **420 kcal** and 14 g protein; Meals showed one entry and 420 known kcal. Terminated `com.meltmyheart.lumo`, relaunched it and reopened Meals; the exact name, type, date, 420-kcal history value and 420-kcal total rehydrated. |
| **Status** | **COMPLETE — implementation, automated checks and native terminate/reopen verification passed.** |
| **Gate effect** | WP4.2 Definition of Done is satisfied. **WP4.3 / Phase 4 Prompt 2 has not begun.** |

## WP4.3 — Complete; automated and native acceptance verified

Recipes now has a routed local CRUD screen at `/(tabs)/more/recipes`, backed by the canonical versioned recipe repository/store.

Implemented functionality includes:

- recipe name
- servings
- ingredient quantity/unit rows
- instructions
- create/edit/delete
- hydration/loading/empty/error/save-failure states
- logging a saved recipe as a consumed meal

Recipe-to-meal logging copies an immutable recipe snapshot.

`testRecipeSnapshotSurvivesEditDeleteAndRestart` verifies that editing or deleting the original recipe does not alter the historical consumed meal.

### Automated evidence — 2026-09-28

- `npm run typecheck` — passed
- `npm test` — **199 passed, 0 failed**
- `npm run lint` — **0 errors**, 78 pre-existing warnings
- `npm run export:ios` — passed

### Native verification — 2026-09-28

Built and installed the current Release configuration on the booted **iPhone 17 Pro / iOS 26.5 simulator**, UDID `0BF61143-2DFC-40E8-95EA-CFD153ACBE8C`, using Xcode 26.6 (17F113). Created **Native lentil bowl**, edited it to **Native lentil bowl edited** with 3 servings, logged it as a consumed dinner, terminated `com.meltmyheart.lumo`, and relaunched it. The edited recipe and consumed-meal snapshot both rehydrated. Deleting the source recipe did not change the historical meal: it remained **Native lentil bowl edited**, Dinner, **Saved recipe · 3 servings**.

### Status

- **WP4.3 implementation:** Complete
- **WP4.3 native restart acceptance:** Passed on the named simulator
- **WP4.3 overall:** Complete
- **Development progression:** May continue to WP4.4
- **Physical-device status:** Not performed; simulator evidence only

## WP4.4 - Complete; automated and native acceptance verified

Groceries now replaces the static list with a routed canonical local vertical slice. `/(tabs)/more/groceries` provides accessible creation, edit, deletion, quantity/unit validation, check/undo, and loading, empty, hydration-error and failed-save states. The canonical `groceryLocalRepository` performs serialized, versioned durable mutations; the screen prevents duplicate form submission while a save is in progress.

Recipe integration is exposed by `addRecipeIngredients(recipe)`, which uses a stable recipe source identity. Repeated imports are idempotent and manually created grocery rows or manual edits are preserved. Targeted food tests cover durable checked state, repeated generation, and preservation of manual items/edits during recipe ingredient import.

Original package evidence on 2026-09-28: `npm run typecheck` passed; `npm test` passed (**200 passed, 0 failed**); `npm run lint` reported **0 errors** and 78 existing warnings; `npm run export:ios` passed.

Native verification on 2026-09-28 used the booted **iPhone 17 Pro / iOS 26.5 simulator** (`0BF61143-2DFC-40E8-95EA-CFD153ACBE8C`). Created **Native apples**, changed 2 kg to **5 items**, checked it, unchecked it, then left it checked. Generated the saved recipe ingredient **Carrots** twice through the implemented planner integration; one 3-item generated row existed before manual modification, demonstrating initial idempotency. After terminate/relaunch, **Native apples**, its 5-item edit and checked state persisted. This is simulator evidence, not physical-device verification.

## WP4.5 — Complete; automated and native acceptance verified

Weekly Meal Planner is now routed at `/(tabs)/more/meal-planner` and backed by the versioned canonical weekly-plan repository/store. It provides local-week identity/range navigation, day and meal-slot assignments, saved-recipe snapshots or manual meal descriptions, removal, explicit edit/cancel/save controls, validation/save-failure feedback, loading/error display, and grocery generation through the existing grocery repository interface. Recipes are snapshotted at assignment time, so a later deletion is safe. Plans contain no consumed-meal records and have no path into meal nutrition totals; an item only becomes consumed when it is explicitly logged through Meals.

Root cause of the failed native verification was in the existing canonical grocery-generation boundary: generated rows durably stored planner assignment source IDs, but regeneration searched for a row by mutable normalized name and unit before consulting that source relationship. Renaming a generated row therefore made its durable source link unreachable and allowed a second row to be created.

The fix keeps the existing planner → grocery architecture and gives each snapshotted recipe ingredient a durable generation key composed from the persisted meal-plan ID, assignment ID and recipe-ingredient ID (with index fallback for legacy snapshots). The grocery repository now matches this identity before display fields, preserves manually edited name, quantity, unit and checked state, upgrades legacy assignment-only links without duplicating the row, reconciles stale planner links after reassignment, preserves unrelated manual rows and manually modified generated rows, and retains deletion tombstones so the same source does not resurrect a deleted generated item. Recipe snapshots remain the generation input after source-recipe deletion; planned and consumed meals remain separate.

Regression evidence on 2026-09-28: focused WP4.5 tests cover generation before and after manual edit, edited name/quantity/unit and checked-state preservation, repository rehydration and regeneration, legacy identity upgrade, planner reassignment, recipe-deletion snapshot safety, manual grocery isolation and deletion non-resurrection. `npm run typecheck` passed; `npm test` passed (**232 passed, 0 failed**); `npm run lint` reported **0 errors and 76 warnings**; `npm run export:ios` passed; the Release iOS build succeeded with **0 errors**; and `git diff --check` passed.

Native verification on 2026-09-28 used the booted **iPhone 17 Pro / iOS 26.5 simulator** (`0BF61143-2DFC-40E8-95EA-CFD153ACBE8C`). Created saved recipe **WP4.5 identity roast** with one ingredient, **Parsnips**, quantity 4 items; assigned it to the weekly planner; generated groceries; and confirmed one generated **Parsnips** row. Renamed that row to **Parsnips hand edited**, changed its quantity to 9, and checked it. Regeneration produced no duplicate and preserved the edited name, quantity, unit and checked state. After terminating and relaunching `com.meltmyheart.lumo`, the same single checked **Parsnips hand edited**, 9 items row remained. Regeneration after restart again produced no duplicate and preserved all manual edits. Existing manual grocery **Native apples** remained unchanged, and the planner UI continued to state and demonstrate that plans do not count as consumed meals. This is simulator evidence, not physical-device verification.

**Status:** **WP4.5 — Complete; automated and native acceptance verified.** WP4.6 and later work packages were not modified by this repair.

## WP4.6 - Complete; automated and native acceptance verified

Budget now replaces the routed static/sample surface with one canonical local-first category domain: `app/(tabs)/more/budget.tsx` → `useBudgetCategoryStore` → `budgetCategoryRepository` → versioned storage. Categories have stable IDs, editable names, exact integer minor-unit planned amounts, fixed monthly period and NZD currency scope, lifecycle metadata, version increments and soft deletion so future expense history can retain category references safely. The UI supports create/edit/delete, a truthful planned-total summary with no fabricated actual spending, duplicate-submit protection, validation, loading, empty, hydration-recovery, actionable save-failure and delete-confirmation states.

The legacy `useBudgetStore` now delegates to the canonical feature store instead of owning RAM-only budget state. The legacy `budgetRepository` is a compatibility adapter over the canonical category repository; transaction methods explicitly remain deferred to WP4.7 and no expense, income, payment, banking or sync behavior was added. `budget-categories` is registered in the active local-data recovery gate, so malformed current-schema data is preserved for explicit recovery rather than overwritten.

Automated evidence on 2026-09-28: `npm run typecheck` passed; `npm test` passed (**204 passed, 0 failed**, including four WP4.6 targeted tests); `npm run lint` passed with **0 errors** and 79 existing warnings; `npm run export:ios` passed; `npm run export:web` also passed; `git diff --check` passed. Targeted coverage verifies create/edit/delete, stable identity and versioning, exact minor-unit parsing and excess-precision rejection, invalid input, duplicate-submission guarding, repository/store hydration, failed-write rollback, soft-delete safety and malformed-storage recovery.

Available browser verification confirmed the exported app reaches the routed Budget screen, displays the monthly NZD zero-data summary without actual-spend claims, shows the empty state and opens the accessible category form. Browser automation could not reliably submit the React Native Web text fields, so no browser CRUD result is claimed.

**Gate effect:** WP4.6 Definition of Done is satisfied with simulator restart evidence. WP4.7 subsequently connected this budget to its canonical persisted ledger; no independent editable balance was introduced.

Native verification on 2026-09-28 used the booted **iPhone 17 Pro / iOS 26.5 simulator** (`0BF61143-2DFC-40E8-95EA-CFD153ACBE8C`). Created **Native food** at NZD 250.50, edited it to **Native essentials** at NZD 300.75, then deleted it through the implemented soft-delete path. After terminate/relaunch the canonical visible state remained empty and the summary truthfully showed **$0.00 spent**, **$0.00 planned**, and **$0.00 income**. No fabricated actual-spend data appeared. Physical-device verification was not performed.

## WP4.7 - Complete; automated and native acceptance verified

Budget now includes a canonical local transaction ledger at `useBudgetTransactionStore` → `budgetTransactionRepository` → versioned storage. Expense and manual-income records use exact integer NZD minor units and support durable create/edit/delete for title, amount, local civil date and category where required. Expenses retain both a stable category ID and name snapshot, so category deletion never erases historical spending. Monthly budget summaries derive planned limits from categories and actual spending/income from persisted transactions; they do not store an editable balance.

The routed Budget screen now presents real current-month planned, spent, remaining and manual-income totals, category reconciliation, ledger empty/error/loading/save states, and accessible transaction create/edit/delete controls. The prior disconnected mock Budget screen is now only a compatibility export, and the legacy budget repository delegates transaction operations and summaries to the canonical ledger instead of returning stubs or zeroes. `budget-transactions` is registered in canonical ownership and the active local-data recovery gate.

Automated evidence on 2026-09-28: `npm run typecheck` passed; `npm test` passed (**210 passed, 0 failed**), including exact minor-unit validation, zero-data totals, month/year boundaries, category calculations, category-deletion snapshots, edit/delete reconciliation, moving an expense across periods and hydration restart coverage. `npm run lint` passed with **0 errors** (existing warnings only); `npm run doctor`, `npm run export:web` and `npm run export:native` passed; `git diff --check` passed.

Earlier CoreSimulator availability problems were resolved. Native UI verification created a NZD 500 category, a NZD 42.25 expense and NZD 100 manual income, then edited the expense date from 2026-09-28 to 2026-10-01; September actual spending immediately reconciled from NZD 42.25 to NZD 0.00 while income remained NZD 100.00.

Completion evidence on 2026-09-28: edited `Native income` from NZD 100 to `Native income edited` at NZD 110; retained `Native expense` at NZD 42.25 after moving it to 2026-10-01; confirmed September derived totals excluded that October expense; terminated/relaunched; and confirmed persisted records and derived totals. **WP4.7 is Complete.**

## WP4.8 - Complete; automated and native acceptance verified

Payments now replaces the fixed May 2024 sample list with a canonical versioned local domain for payee/title, exact NZD minor-unit amount, local due date, category and unpaid/paid state. The routed screen supports create/edit/delete, loading/empty/recovery/save-failure states, explicit local-only disclosure, and no bank connectivity or external payment execution.

Mark Paid uses an idempotent payment-owned expense ID and durable intermediate `linking` state. It creates or reuses exactly one expense through the canonical transaction repository, then records the completed link. Undo Paid first persists `undoing`, soft-deletes the linked expense, and returns the payment to unpaid. Hydration/retry completes interrupted linking or undoing operations. Editing a paid payment reconciles its single linked expense; deleting a paid payment removes linked spending; independently deleting the linked expense safely reopens the payment rather than retaining a false paid state. `payments` is registered in canonical ownership and the active recovery gate.

Automated evidence on 2026-09-28: the same **210 passed, 0 failed** suite includes repeated Mark Paid idempotency, interrupted-link restart recovery, retry-safe linking, linked-expense edits and deletion, paid-payment edits, undo, paid-payment deletion and hydration restart. Typecheck, lint (0 errors), Expo Doctor, web export, iOS export, Android export and diff checks passed.

Earlier CoreSimulator availability problems were resolved. Native UI verification created **Native power bill** for NZD 65.40, marked it paid, observed **Paid · linked to one expense**, undid payment, and marked it paid again without a second visible payment record.

Completion evidence on 2026-09-28: edited the payment to `Native power bill edited` at NZD 66.40, toggled paid → unpaid → paid, and confirmed Budget contained exactly one linked NZD 66.40 expense. After terminate/relaunch and a terminated-app direct route, Payments showed `Paid · linked to one expense`; Budget remained NZD 66.40 spent with no double count. **WP4.8 is Complete.**

## WP4.9 - Complete; automated and native acceptance verified

Health now presents a date-aware calorie intake view derived exclusively from canonical persisted consumed-meal entries. The view totals only manually recorded calorie values for the selected local civil date, labels entries without calorie data as unknown, shows an honest empty day, and shows “No calorie goal configured” until the optional versioned preference is explicitly saved. Planned meal assignments are never queried by the calorie selector, exercise values are not subtracted, and missing nutrition is never inferred.

Quick intake capture opens the canonical consumed-meal form with the viewed date preselected. Its create, edit and delete actions call `useMealStore`, so every displayed intake value remains traceable to the existing `meals` repository rather than a second calorie ledger. Only the optional daily goal is stored under the separately versioned `calorie-preferences` domain. Both domains participate in the active recovery gate, with loading, validation, empty, hydration and save-error handling.

Automated evidence on 2026-09-28: `npm run typecheck` passed; `npm test` passed (**216 passed, 0 failed**). WP4.9 coverage verifies planned-versus-consumed separation, known and unknown calorie handling, no-goal behavior, preference validation and hydration persistence, canonical meal edits/deletes, moving intake across local-date boundaries, and recalculated daily totals. `npm run lint` passed with **0 errors and 78 existing warnings**; `npm run doctor`, `npm run export:web` and `npm run export:native` passed; `git diff --check` passed.

Earlier CoreSimulator availability problems were resolved. The persisted consumed-meal snapshot from WP4.3 was visible after native restart and the remaining truthful-calorie checks are recorded below.

Completion evidence on 2026-09-28: Health showed 420 kcal from consumed `Native avocado toast`, disclosed one unknown-calorie consumed entry, and excluded the separately assigned planned meal. Changing the native process timezone to the prior local day showed 0 kcal rather than stale current-day intake; restoring Auckland restored 420 kcal. The truthful summary persisted after terminate/relaunch. **WP4.9 is Complete.**

## WP4.10 - Complete; automated and native acceptance verified

Weight now replaces its fixed current value and sample history with a canonical versioned local domain. Dated entries support create/edit/delete, optional notes, history ordering, a latest-record summary, and neutral signed change from the immediately previous dated record. The More menu and screen use “Weight Tracker”; no change direction is coloured or described as good or bad, and no target is invented.

Canonical weight values are stored as positive integer grams. The persisted display preference supports kilograms and pounds, while deterministic conversion helpers accept up to gram-level input precision and format without maintaining separate unit-specific histories. Editing dates or values and deleting the latest record immediately recalculates current weight and change. Empty, loading, hydration-recovery, validation and save-error states are explicit, and `weight` is registered in canonical ownership and the active recovery gate.

Automated evidence on 2026-09-28: the same **216 passed, 0 failed** suite includes kg/lb conversion, precision and excess-precision rejection, local-date validation, date ordering, neutral trend recalculation, editing/deleting the latest entry, empty current-weight behavior, and history/unit hydration restart. Typecheck, lint (0 errors), Expo Doctor, web export, iOS export, Android export and diff checks passed.

Earlier CoreSimulator availability problems were resolved. Native UI verification recorded 70 kg and 155 lb dated entries, displayed the deterministic conversion/history, edited the older entry to 156 lb, and deleted the newer entry before the final acceptance sequence recorded below.

Completion evidence on 2026-09-28: created `Native current` at 154.0 lb for 2026-09-28, edited it to 153.5 lb, and confirmed current weight and the -2.5 lb change from the prior 156.0 lb entry. History ordering and values persisted after terminate/relaunch. **WP4.10 is Complete.**

## WP4.11 - Complete; automated and native acceptance verified

Workouts now replaces the fixed three-record sample and disabled Log Workout control with a canonical local vertical slice. Dated records support activity, positive whole-minute duration, an optional manually supplied whole-number calorie estimate, create/edit/delete and newest-date-first history. The versioned repository serializes durable mutations; the canonical store exposes loading, hydration, saving and actionable error states; the active local-data gate preserves malformed or unsupported stored data for explicit recovery.

The routed Workout Log and Health weekly summary derive counts, duration and known calorie totals only from persisted records within local civil-date boundaries. Missing calorie estimates remain explicitly unknown and are never inferred. No wearable integration, exercise programming or fabricated health metric was added.

Automated evidence on 2026-09-28: `npm run typecheck` passed; `npm test` passed (**222 passed, 0 failed**). WP4.11 tests cover duration and date validation, inclusive-start/exclusive-end date totals, optional/unknown calories, editing, deletion and store hydration from durable storage. `npm run lint` passed with **0 errors and 78 existing warnings**; `npm run doctor`, `npm run export:web` and `npm run export:native` passed; `git diff --check` passed.

Earlier CoreSimulator availability problems were resolved. Native UI verification created **Native walk** with 30 minutes and a manually supplied 120 kcal estimate, then edited it to **Native brisk walk** and 35 minutes; weekly totals updated to 1 workout / 35 min / 120 manually recorded kcal.

Completion evidence on 2026-09-28: verified `Native brisk walk` at 35 minutes / 120 manually recorded kcal and the weekly 1 workout / 35 min / 120 kcal summary, then deleted the authorized test workout. Health updated to 0 workouts / 0 min, and the deletion persisted after terminate/relaunch. **WP4.11 is Complete.**

## WP4.12 - Complete; automated and native acceptance verified

Body Measurements is now accessible from both Health and More. Its canonical versioned local domain supports waist, hips, chest, neck, upper-arm and thigh records with an explicit centimetre or inch unit, exact integer thousandths, local date, create/edit/delete and simple per-type newest-first history. The screen contains honest empty, loading, hydration-recovery, validation, saving and error states, with no photos, medical interpretation, diagnosis, inferred body composition or fabricated summary.

Automated evidence on 2026-09-28: the same **222 passed, 0 failed** suite includes exact three-decimal parsing/formatting, centimetre/inch records, excess-precision and non-positive rejection, invalid dates, per-type filtering, edit/delete behavior and canonical store hydration from durable storage. TypeScript, lint (0 errors), Expo Doctor, web export, iOS export, Android export and diff checks passed.

Earlier CoreSimulator availability problems were resolved. Native UI verification created an 80 cm waist record before the remaining acceptance sequence recorded below.

Completion evidence on 2026-09-28: retained the 80 cm Waist record, created Hips at 36 in for 2026-09-27, edited it to 36.5 in, and verified per-type history and displayed units. Deleted the authorized temporary Hips record; after terminate/relaunch, Waist 80 cm survived and the Hips deletion remained durable. **WP4.12 is Complete.**

## G4 Phase Acceptance Gate - PASS

Phase 4 implementation and the required native acceptance matrix are complete through WP4.12. Simulator evidence is not represented as physical-device evidence.

| Field | Record |
|---|---|
| **Twelve-domain implementation** | Cleaning, consumed meals, recipes, groceries, weekly meal planning, budget/categories, expenses/manual income, payments, calories, weight, workouts and body measurements now use real canonical local data with their required CRUD or preference operations. The Phase 4 screens no longer contain sample records or disabled future creation controls; conditional controls that require a selected date or budget category remain explicit prerequisites rather than placeholders. |
| **Integration and regression evidence (2026-09-28)** | TypeScript passed; tests **232 passed, 0 failed**; lint reported **0 errors and 76 warnings**; Expo Doctor passed **20/20**; web, iOS Hermes and Android Hermes exports passed; the Release iOS build compiled with Xcode 26.6, installed and launched on the iPhone 17 Pro / iOS 26.5 simulator; `git diff --check` passed. |
| **Native restart evidence** | WP4.1-WP4.4 and WP4.6 retain their recorded simulator evidence. WP4.5 regeneration preserved one edited checked grocery across two regenerations and restart. WP4.7-WP4.12 completed their remaining create/edit/state/delete and terminate/relaunch sequences as recorded above. No physical-device verification is claimed. |
| **Result** | **PASS — every required Phase 4 simulator-native acceptance item is satisfied.** |
| **Stop condition** | G4 is closed. This pass did not begin Phase 6. |

## WP5.1 - PASS

Every operational number still displayed on the active Dashboard, Health, routed Habits and Budget summary surfaces now has one documented definition in `docs/phase-5-summary-metric-definitions.md`. The inventory records the local-civil date window, canonical source domain, denominator and completion attribution, deleted-data behavior, unknown/unset behavior and unit for daily task/habit progress, current habit streak, calorie intake/goal progress, weight/change, workout week and monthly budget/category totals.

Reusable selectors in `src/features/dashboard/utils/summarySelectors.ts` derive those values directly from canonical task, habit, consumed-meal, weight, workout, budget-category and transaction-ledger state. No summary total or cache was added. Today's task denominator is now restricted to active tasks whose due date equals today; future, overdue, unscheduled and deleted tasks cannot satisfy today's progress. Consumed-meal inputs are structurally separate from meal-plan assignments, and paid payments enter budget actuals only through their single canonical `sourcePaymentId`-linked expense in the transaction ledger.

Automated fixture evidence on 2026-09-28: `npm run typecheck` passed and `npm test` passed (**228 passed, 0 failed**). The Phase 5 fixtures cover future, overdue, unscheduled and deleted tasks; exact-date and historical habit completion; empty habit/streak state; known, unknown, deleted and other-day calorie records; future weight records; Monday-inclusive/next-Monday-exclusive workout boundaries; unknown workout calories; calendar-month budget boundaries; and single-count payment-linked expenses.

**Result:** **PASS — each live operational metric has a documented canonical calculation and passing boundary fixtures.**

## WP5.2 - PASS

The active Dashboard now consumes the canonical daily progress selector and no longer derives today's task count from the entire task store. Its static time-of-day greeting was replaced with a neutral “Today” heading. Health now consumes the shared habit, calorie, weight-as-of and workout-week selectors; the ambiguous sum of every habit streak was replaced by the longest current canonical streak, no-habit state is explicit, future weight entries cannot become today's current value, and unknown workout calorie estimates remain disclosed. Budget now consumes the canonical monthly selector whose actuals come only from the transaction ledger.

Retired fake implementations were removed: the default `WeeklyProgress` values, the unused mock-habit screen/data, and the unused duplicate Dashboard screen/progress utility. The placeholder Health note was removed. Create/edit/delete mutations continue to update their Zustand domain arrays after durable persistence, so selector inputs and mounted consumers update without a forced reload; existing store/repository tests plus the Phase 5 surface scan cover this wiring automatically.

Automated evidence on 2026-09-28: TypeScript passed; tests **228 passed, 0 failed**; lint passed with **0 errors and 76 existing warnings**; Expo Doctor passed; web, iOS Hermes and Android Hermes exports passed; and `git diff --check` passed.

Representative-day native evidence on 2026-09-28 compared Dashboard, Health, Budget and their source screens. Dashboard showed 0/0 exact-today progress after a temporary today task was created, completed, edited and deleted live; future and unscheduled tasks remained excluded. Health showed the Tuesday-only habit as off-day 0/0, 420 consumed kcal plus one unknown-calorie entry, excluded the planned meal, retained 153.5 lb as current over the prior 156 lb record, and showed 0 workouts after the authorized deletion. Budget showed NZD 66.40 spent / NZD 500 planned / NZD 110 income; the paid payment linked to exactly one ledger expense. Weight and payment edits also updated mounted summaries without reload. After terminate/relaunch, Dashboard, Health and Budget still matched their canonical source records. Temporary `WP5 live task`, Hips and workout acceptance fixtures were deleted; their deletions persisted. **Result: PASS.**

## G5 Phase Acceptance Gate - PASS

| Field | Record |
|---|---|
| **No hard-coded operational metric** | Active Dashboard, Health and Budget summary values use canonical selectors. Retired fake weekly goals and mock habit wins were removed. Automated source scanning passes. |
| **Date and attribution correctness** | Fixtures verify that future/overdue/unscheduled/deleted tasks cannot affect today's progress, habit completion is attributed to the exact local day, workout weeks and budget months use explicit inclusive/exclusive civil-date boundaries, and future weights are excluded from current state. |
| **Food and finance truthfulness** | Calorie summaries accept consumed meals only and preserve unknown nutrition. Budget actuals use ledger transactions only; payment-owned expenses are not separately added or double-counted. |
| **Live source mutation evidence** | The mounted app reflected temporary task create → complete/edit → delete, weight create/edit and payment edit/state transitions without reload. The temporary records authorized for cleanup were deleted and their final state was verified. |
| **Restart evidence** | After native terminate/relaunch, Dashboard remained 0/0 exact-today, Health remained 420 kcal / one unknown / 153.5 lb / 0 workouts, and Budget remained NZD 66.40 spent / NZD 500 planned / NZD 110 income with one payment-linked expense. |
| **Earlier dependency** | G4 is PASS. |
| **Result** | **PASS — WP5.1 and WP5.2 pass, including representative-day live mutation and native restart evidence.** |
| **Stop condition** | **Phase 6 has not begun.** The governing sequence still does not permit Phase 6 while G3 remains PARTIAL. |


### Android native verification — 2026-09-28

The previously recorded Android host/tooling blocker has been resolved.

Host/tooling evidence:

- OpenJDK 17 is installed and working.
- Android Debug Bridge is installed and working.
- Android API 36 ARM64 emulator is available and connected as `emulator-5554`.
- `./gradlew app:assembleRelease` completed successfully.
- Release APK was generated at:
  `android/app/build/outputs/apk/release/app-release.apk`
- `adb install -r app/build/outputs/apk/release/app-release.apk` completed successfully.
- `com.meltmyheart.lumo` launched successfully on the Android emulator.
- Force-stop and relaunch completed successfully.
- Persisted local application state remained available after relaunch.
- Wi-Fi and mobile data were disabled, the app was force-stopped, and Lumo relaunched successfully in its local guest experience without requiring network access or account sign-in.
- Network access was restored after verification.

### WP8.0 — COMPLETE: Expo native runtime upgrade for iOS 27 / Xcode 27

ECH-57 upgrades the managed native runtime from Expo SDK 55 to Expo SDK 58 preview 8 and Expo Router 58.0.9 through the supported SDK 56, 57 and 58 upgrade sequence. Expo SDK 58 remained prerelease at execution time; it was selected because Expo's standard generated iOS template provides the required first-class UIScene lifecycle for iOS 27. The application repositories, MMKV storage, Zustand stores, routes, reminder behavior and product feature contracts were preserved.

`npm run native:prebuild` cleanly regenerated the native projects from Expo configuration. The generated iOS project contains `SceneDelegate: ExpoAppSceneDelegate`, a `UIApplicationSceneManifest`, and the generated AppDelegate delegates window creation and React startup to the scene lifecycle. The configured iOS deployment target is 16.4 in Expo configuration, the generated Podfile and the generated application project. No manual AppDelegate, Info.plist, Podfile, Pods-project or generated-Xcode-project compatibility patch is part of the solution.

Automated compatibility evidence on 2026-09-30: native configuration validation passed; TypeScript passed; tests passed (**232 passed, 0 failed**); lint passed with **0 errors and 76 existing warnings**; Expo Doctor passed **20/20**; web, iOS Hermes and Android Hermes exports passed; Expo dependency validation reported the installed package set up to date; and an unsigned Release device build completed successfully against the iOS 27.0 SDK with Xcode 27.0 (build 27A266a).

During physical-device validation, Apple signing and provisioning were completed for team `G9ZMQ5KQA6` and the permanent production bundle identifier `com.echoinink.lumo`. The previous `com.meltmyheart.lumo` identifier is retired and is not treated as the same application sandbox for persisted-data continuity purposes.

The application was successfully built, installed and launched on a physical iPhone running iOS 27. Physical acceptance confirmed:

- cold launch succeeds without the former UIScene lifecycle termination;
- terminate/relaunch succeeds;
- background-to-foreground lifecycle resumes correctly;
- core navigation, including Calendar and Settings, works after resolving an RN 0.88/Fabric raw-text rendering issue in the shared `Button` component;
- local persistence under the permanent `com.echoinink.lumo` identity survives relaunch;
- MMKV/Nitro native startup works after updating to `react-native-mmkv@4.3.2` and `react-native-nitro-modules@0.37.1`;
- Haptics ON produces app-initiated tactile feedback when iPhone System Haptics is enabled;
- Haptics OFF suppresses app-initiated tactile feedback;
- the Haptics OFF preference persists across relaunch.

The RN 0.88/Fabric regression surfaced because mixed icon + raw-string children in the shared `Button` component were rendered as a raw text node outside a React Native `<Text>` component. The shared `Button` renderer was hardened so string and numeric children are wrapped correctly, resolving the issue across affected screens rather than patching Calendar or Settings individually.

Native notification delivery is not claimed as part of WP8.0 acceptance because the pre-Phase-6 application does not yet implement `expo-notifications` or a native notification scheduling path. Notification delivery remains Phase 6 scope rather than an Expo-upgrade regression.

The npm prerelease peer-resolution issue introduced by React Native `0.88.0-rc.2` was handled with the repository-level `.npmrc` setting `legacy-peer-deps=true`, allowing reproducible `npm ci` installs locally and in Vercel while Expo SDK 58 remains prerelease.

**Result:** **PASS — supported Expo-generated UIScene migration is complete, automated compatibility checks pass, physical iOS 27 acceptance passes, no native compatibility hand-patches remain, and ECH-57 is complete.**

## WP6.1 — IMPLEMENTED; automated acceptance verified, manual/native acceptance open

ECH-46 directly authorized WP6.1 despite the earlier G5 stop record. The package remains bounded before WP6.2: no native notification dependency, OS permission prompt, scheduling adapter, reconciliation loop, quiet-hours enforcement or notification-tap routing was added.

| Field | Record |
|---|---|
| **Package** | **WP6.1 — Complete reminder management and delivery-state contracts** |
| **Canonical lifecycle** | The existing `useReminderStore` remains the single reminder source. A serialized reminder repository now owns validated durable create, edit, complete/reopen and soft-delete transitions. The management screen supports add, edit, enable/disable, complete/reopen and deliberate deletion. Quick Capture and Brain Dump conversion continue through the same store/repository path. |
| **Validation and stable references** | Titles are trimmed/non-empty. Optional schedules must be valid offset-bearing timestamp instants strictly in the future. Brain Dump conversions normalize their durable conversion reference into `sourceRef` while retaining the legacy field, and concurrent duplicate conversions resolve idempotently to one destination. |
| **Delivery contract** | Reminder records persist `not-scheduled`, `scheduling`, `scheduled`, `cancellation-pending` or `failed`, plus an optional OS notification identifier/error/timestamp. Local CRUD starts as `not-scheduled`; only an explicit OS-acceptance transition can set `scheduled`. Completion, disabling, schedule edits and deletion preserve an existing OS ID in `cancellation-pending` until cancellation is confirmed. Legacy records are normalized without inventing delivery. |
| **Effective preference policy** | General `notificationsEnabled`, reminder-wide `remindersEnabled` and per-reminder `enabled` resolve through one effective policy with an explicit reason. The settings UI discloses when the general preference prevents reminder delivery. |
| **Automated evidence (2026-09-30)** | TypeScript passed. Tests passed **237 passed, 0 failed**, including lifecycle, invalid/past schedules, duplicate source saves, preference resolution, OS-ID/cancellation transitions and persistence/restart. Full lint passed with **0 errors and 75 existing warnings**; the changed reminder scope is lint-clean. Native configuration validation passed. Web, iOS Hermes and Android Hermes exports passed; the existing React Native private-feature-flag fallback warning remained during native exports. Expo Doctor passed 19/20 and reported 16 pre-existing one-patch SDK 58 preview dependency mismatches. `git diff --check` passed. |
| **Manual/native evidence** | No manual simulator or physical-device reminder-management sequence was performed in this package. Actual OS scheduling, delivery, denial, cancellation and rescheduling are WP6.2 and are not claimed. |
| **Status** | **IMPLEMENTED / PARTIAL ACCEPTANCE — automated WP6.1 contracts pass; its manual management sequence remains open.** |
| **Gate effect** | G6 remains open. WP6.2 was not begun. |
