# Native build and validation baseline

This document is the WP1.3 reproduction record for Expo SDK 55. It covers local-first development, internal preview, future production builds, and the native validation gates. It does not configure store submission or EAS Update.

## Prerequisites

- Node.js 20.19 or newer and the dependencies installed with `npm ci`.
- For local iOS builds: macOS, Xcode 26.2 or newer, CocoaPods, and an iOS simulator or registered device.
- For local Android builds: Android Studio/SDK 36, a JDK supported by the generated Gradle project, and an emulator or USB-debuggable device.
- For EAS cloud builds: an Expo account. Physical iOS internal distribution also requires Apple signing credentials and device registration. These are build-time requirements only; the installed app does not require an account or backend credentials.

The repository uses Expo Continuous Native Generation. `ios/` and `android/` are generated and ignored; do not make durable changes in those directories.

## Credential-free automated gates

Run the gates from the repository root. The config/export commands set `EXPO_NO_DOTENV=1` and remove Lumo's public backend variables before invoking Expo.

```sh
npm ci
npm run config:check
npm run typecheck
npm test
npm run lint
npm run doctor
npm run export:web
npm run export:ios
npm run export:android
```

`npm run validate` runs the same project gates in sequence. `npm run validate:native` is the shorter config plus iOS/Android Hermes export gate.

## Local native compilation and installation

Regenerate native projects from tracked app configuration before a clean native validation run:

```sh
npm run native:prebuild
```

Development builds include `expo-dev-client`, install on the selected simulator/emulator or device, and start Metro:

```sh
npm run native:ios:development -- --device
npm run native:android:development -- --device
```

Production-mode local compiles embed the JavaScript bundle and do not start Metro. They are validation builds, not store-signed submissions:

```sh
npm run native:ios:release -- --device
npm run native:android:release -- --device
```

When no `--device` value is supplied, Expo prompts for an available target. The iOS command uses Xcode's `Release` configuration; the Android command uses the Gradle `release` variant.

## EAS installable builds

`eas.json` defines these profiles:

| Profile | Purpose | Installability |
|---|---|---|
| `development` | Physical-device development client | Internal iOS build / Android APK |
| `development-simulator` | iOS simulator development client | iOS simulator app |
| `preview` | Production-like tester build without developer tools | Internal iOS build / Android APK |
| `preview-simulator` | Production-like iOS simulator smoke testing | iOS simulator app |
| `production` | Future store build | Store artifact only; no submit profile is configured |

Create builds with the EAS CLI:

```sh
npx eas-cli@latest build --platform ios --profile development
npx eas-cli@latest build --platform android --profile development
npx eas-cli@latest build --platform ios --profile preview
npx eas-cli@latest build --platform android --profile preview
```

Simulator alternatives use `--profile development-simulator` or `--profile preview-simulator`. The reserved production artifacts use `--profile production`; creating or submitting those artifacts is outside WP1.3.

The first EAS invocation may offer to link/create the EAS project and configure signing. Do not add backend environment variables, an update URL, a channel, or a submit profile as part of that setup.

## Required device smoke test

Perform this checklist independently on iOS and Android using a `preview` build (preferred) or a local release build:

1. Install the new binary on the device.
2. Disable or omit `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, and `EXPO_PUBLIC_SUPABASE_ANON_KEY` at build time.
3. Terminate the app process, then cold-launch it.
4. Confirm the guest Dashboard opens without an account prompt or remote-configuration error.
5. Create or inspect local guest data, terminate the process, and reopen it.
6. Enable airplane mode, terminate the process again, and reopen it.
7. Confirm guest startup and local navigation still work and no account configuration is requested.

Record the device model, OS version, profile/artifact, result, and date in the WP1.3 completion record. A native export or simulator-only run does not substitute for this physical-device evidence.

## Versioning and release boundary

The app version is `1.0.0`, with iOS build number `1` and Android version code `1`. `appVersionSource` is local, so future increments remain explicit tracked changes. No submit profile, EAS Update URL/channel/runtime version, account bootstrap, or cloud runtime dependency is configured.
