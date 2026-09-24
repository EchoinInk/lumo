# WP1.2 dependency security triage

**Assessment date:** 2026-09-24  
**Tested toolchain:** Node.js 24.21.0, npm 11.19.0, Expo SDK 55

## Baseline

Before WP1.2, `npx expo-doctor` passed 19 of 20 checks and reported 11 SDK patch mismatches. `npm audit --omit=dev --json` reported 29 advisory-bearing packages: 12 high, 15 moderate, 2 low and no critical findings.

## Remediated findings

- Updated the 11 packages identified by Expo Doctor to the supported SDK 55 patch set.
- The Expo/React Native refresh removed the Metro and `image-size` high-severity chain, the `@xmldom/xmldom` high-severity chain and the stale React Navigation advisory from the installed tree.
- Applied compatible in-range transitive updates for `@babel/core`, `baseline-browser-mapping`, `brace-expansion`, `browserslist`, `js-yaml`, `nanoid`, `postcss`, `postcss-selector-parser` and `shell-quote`. These removed all remaining high- and low-severity findings without dependency overrides.
- Updated `lucide-react-native` to the smallest checked release line with a React 19 peer declaration and aligned Zustand with the already-intended 5.x line. Normal npm peer resolution now succeeds without `legacy-peer-deps`.

## Remaining advisories

The final production audit reports **13 moderate, 0 high, 0 critical and 0 low**. The 13 package entries represent two underlying advisory paths.

### Router query decoder — moderate

- **Reported packages:** `expo-router`, `query-string`, `decode-uri-component`.
- **Dependency path:** direct `expo-router@55.0.18` -> `query-string@7.1.3` -> `decode-uri-component@0.2.2`.
- **Advisory:** GHSA-vcc3-ghjq-m6fr, exponential processing of malicious malformed percent-encoded input.
- **Runtime exposure:** the dependency is present in the router bundle, but the installed SDK 55 router calls `query-string.stringify` only. Its old `queryString.parse` path is commented out; incoming route parameters are parsed with `URLSearchParams`. No current Lumo code imports this decoder. The vulnerable decoding operation is therefore not reachable in the tested application graph. If a future router patch restores this parser, an attacker-controlled deep link could create a local availability issue and this disposition must be revisited.
- **Compatible remediation:** none currently published within the Doctor-supported SDK 55 router set. npm proposes `expo-router@5.1.11`, which is a cross-generation downgrade and is rejected by the WP1.2 constraints. Forcing `query-string` across its parent major contract is also not a supported remediation.
- **Disposition:** accepted, monitored transitive risk; revisit on an SDK 55 router patch or the next authorized Expo generation.

### Expo configuration/Xcode UUID chain — moderate

- **Reported packages:** `expo`, `expo-splash-screen`, `@expo/cli`, `@expo/config`, `@expo/config-plugins`, `@expo/local-build-cache-provider`, `@expo/metro-config`, `@expo/prebuild-config`, `xcode` and `uuid`.
- **Dependency path:** `expo@55.0.31` and `expo-splash-screen@55.0.25` -> Expo configuration/prebuild packages -> `@expo/config-plugins@55.0.11` -> `xcode@3.0.1` -> `uuid@7.0.3`.
- **Advisory:** GHSA-w5hq-g745-h8pq, a missing buffer bounds check in UUID v3/v5/v6 when a caller supplies an output buffer.
- **Runtime exposure:** build/configuration only; this chain is not part of application runtime behavior. The installed `xcode` package calls `uuid.v4()` without a caller-supplied buffer, so the advisory's affected functions and precondition are not used by the dependency path.
- **Compatible remediation:** none in the Doctor-supported SDK 55 package set. npm suggests downgrading Expo to 46 and separately upgrading splash screen to the SDK 57 line; both break the required SDK 55 contract. Overriding `uuid` from 7 to 11 would cross the direct parent's major contract without upstream compatibility evidence.
- **Disposition:** accepted build-time transitive risk; process only trusted project/configuration inputs and update when Expo publishes a compatible dependency chain.

## Final security disposition

All serious findings are triaged. No critical or high advisory remains. The remaining moderate entries have explicit dependency paths, reachability analysis and remediation constraints; neither path justifies an unsupported dependency override or Expo generation change.
