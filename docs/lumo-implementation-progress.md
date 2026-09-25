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
