import {
  clearRecordedAuthCallbackUrl,
  getRecordedAuthCallbackUrl,
  recordAuthCallbackUrl,
  resolveAuthCallbackUrl,
} from "@/services/api/auth/authCallbackLink";
import { assertEqual } from "../testUtils";

const callbackUrl = "lumomobile://auth/callback?code=opaque";

export function testAuthCallbackFallsBackToTheNativeInitialUrl(): void {
  clearRecordedAuthCallbackUrl();
  assertEqual(
    resolveAuthCallbackUrl(null, callbackUrl),
    callbackUrl,
    "a cold-start callback must not be treated as incomplete when the route hook is empty",
  );
}

export function testAuthCallbackPrefersTheFreshNativeInitialUrlOverMemory(): void {
  clearRecordedAuthCallbackUrl();
  recordAuthCallbackUrl("lumomobile://auth/callback?code=older");
  assertEqual(
    resolveAuthCallbackUrl(null, callbackUrl),
    callbackUrl,
    "a fresh cold-start URL must not be replaced by an earlier callback kept only for warm-link delivery",
  );
  clearRecordedAuthCallbackUrl();
}

export function testAuthCallbackUsesTheRootCapturedWarmLink(): void {
  clearRecordedAuthCallbackUrl();
  recordAuthCallbackUrl(callbackUrl);
  assertEqual(
    resolveAuthCallbackUrl(null, null),
    callbackUrl,
    "a link consumed by Expo Router must remain available to the callback screen",
  );
  clearRecordedAuthCallbackUrl(callbackUrl);
  assertEqual(getRecordedAuthCallbackUrl(), null, "processed callback URLs must not remain in memory");
}

export function testAuthCallbackDoesNotCaptureUnrelatedLinks(): void {
  clearRecordedAuthCallbackUrl();
  recordAuthCallbackUrl("lumomobile://settings");
  assertEqual(getRecordedAuthCallbackUrl(), null, "only the auth callback route may be captured");
}
