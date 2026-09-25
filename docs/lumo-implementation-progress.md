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

## WP1.3 - Implementation complete; partial acceptance

The repeatable native build baseline is implemented. By product-owner direction on 2026-09-24, G1 is provisionally open for Phase 2 development while final device acceptance remains outstanding. This validation host has no Java runtime or `adb`, and no physical devices are attached, so Android compilation and the required physical-device cold-launch and airplane-mode evidence cannot be completed here. That evidence remains mandatory before G8 release qualification.

## Completion record

| Field | Record |
|---|---|
| **Package** | **WP1.3 — Establish installable builds and native validation gates** |
| **Audit coverage** | Implements the missing release/build identity and native-validation portions of **B32**, and extends the automated gate coverage associated with **B34**. No Phase 2 work was started. |
| **Build configuration** | Added tracked iOS build number, Android version code, application icons, local version sourcing, and EAS `development`, `development-simulator`, `preview`, `preview-simulator`, and reserved `production` profiles. Development profiles create development clients; preview profiles create installable internal-distribution artifacts; production remains store-distributed but has no submission configuration. |
| **Local-first guard** | Config and export scripts set `EXPO_NO_DOTENV=1` and remove Lumo's public API/Supabase variables. The config gate also rejects an EAS Update URL and checks that no backend variable name is exposed in resolved public config. No update channel, runtime version, submit profile, backend secret, account bootstrap, or cloud runtime dependency was added. |
| **Commands and runbook** | Exact clean-generation, export, local compilation, EAS build, and physical-device smoke-test commands are recorded in [native-build-validation.md](/Users/echoin.ink/Developer/lumo/docs/native-build-validation.md). |
| **Automated evidence (2026-09-24)** | Credential-free config resolution passed; TypeScript passed; tests **106 passed, 0 failed**; lint **0 errors, 88 existing warnings**; Expo Doctor **20/20**; web export passed; iOS Hermes export passed; Android Hermes export passed; clean `expo prebuild --clean --no-install` passed in an isolated copy; iOS CocoaPods resolution passed. |
| **Native compile evidence (2026-09-24)** | iOS unsigned Release simulator compilation **passed** from the clean generated project with Xcode 26.6 and CocoaPods 1.17.0. The artifact installed on an iPhone 17 Pro / iOS 26.5 simulator; initial cold launch and terminate/relaunch both succeeded, the process remained active, and visual inspection confirmed the guest Dashboard without an account prompt. Android `:app:assembleRelease` was attempted and is blocked before Gradle starts because this host has no Java runtime; `adb` is also unavailable. |
| **Unavailable acceptance evidence** | **Blocking:** no physical iOS or Android device is attached, so install, cold launch, process restart, airplane-mode reopen, and confirmation of account-free guest startup on real devices remain unverified. **Blocking:** Android native compilation requires a supported JDK and Android SDK/ADB. The successful iOS simulator run is useful evidence but is not treated as a substitute for the required physical-device checks. |
| **Status** | **Implementation complete; partial acceptance** |
| **Gate effect** | **G1 is provisionally open for Phase 2 development by product-owner direction.** Final acceptance still requires Android Release compilation and the documented preview/release smoke checklist on physical iOS and Android devices, and must be completed before G8 release qualification. |

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
| **Manual verification gap** | **Blocking for final G2 acceptance:** the roadmap's interactive change-device-date/timezone and background/resume check around midnight was not performed. A booted iOS simulator is available, but deterministic lifecycle and timezone tests are not represented as a manual simulator or physical-device acceptance run. |
| **Scope preserved** | No storage key or schema-version migration, database replacement, notification delivery/reconciliation implementation, arbitrary-date picker expansion, sync protocol change or WP2.5 shared-planning-store work was introduced. |
| **Status** | **Implementation complete; automated acceptance verified; manual acceptance blocked.** |
| **Gate effect** | WP2.4 implementation and automated Definition of Done are satisfied. Phase 2 remains active; the manual clock/timezone resume scenario blocks final G2 acceptance. **WP2.5 has not begun.** |
