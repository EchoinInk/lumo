import {
  beginRecoverySession,
  clearRecoverySession,
  hasRecoverySession,
} from "@/services/api/auth/recoverySessionGuard";
import {
  getAuthCallbackCredentialType,
  getAuthCallbackIntent,
  getAuthCallbackParameters,
} from "@/services/api/auth/authCallbackIntent";
import { assert, assertEqual } from "../testUtils";

export function testRecoverySessionRequiresCallbackAndCanBeCleared(): void {
  clearRecoverySession();
  assertEqual(hasRecoverySession(), false, "recovery must not be active by default");

  beginRecoverySession();
  assert(hasRecoverySession(), "a verified recovery callback should enable password update");

  clearRecoverySession();
  assertEqual(hasRecoverySession(), false, "completed or interrupted recovery must require a new link");
}

export function testAuthCallbackRecognisesRecoveryAcrossQueryAndFragment(): void {
  assertEqual(
    getAuthCallbackIntent("lumomobile://auth/callback?type=recovery&code=opaque"),
    "recovery",
    "PKCE recovery callbacks should open password choice",
  );
  assertEqual(
    getAuthCallbackIntent("lumomobile://auth/callback#type=recovery&access_token=opaque"),
    "recovery",
    "implicit recovery callbacks should open password choice",
  );
  assertEqual(
    getAuthCallbackIntent("lumomobile://auth/callback?type=signup"),
    "confirmation",
    "non-recovery callbacks should not unlock password updates",
  );
}

export function testAuthCallbackSupportsPkceCredentialsWithRecoveryTypeInFragment(): void {
  const url = "lumomobile://auth/callback?code=opaque#type=recovery";
  assertEqual(
    getAuthCallbackCredentialType(url),
    "pkce",
    "PKCE credentials must not be discarded when the recovery type is in the fragment",
  );
  assertEqual(
    getAuthCallbackIntent(url),
    "recovery",
    "a mixed query-and-fragment recovery callback should open password reset",
  );
}

export function testPasswordRecoveryAuthEventHandlesPkceLinksWithoutType(): void {
  assertEqual(
    getAuthCallbackIntent("lumomobile://auth/callback?code=opaque", "PASSWORD_RECOVERY"),
    "recovery",
    "Supabase PASSWORD_RECOVERY must take precedence when PKCE links omit the type",
  );
}

export function testAuthCallbackRejectsMissingAndMalformedCredentialsSafely(): void {
  assertEqual(
    getAuthCallbackCredentialType("lumomobile://auth/callback"),
    "missing",
    "a token-free callback must not establish a session",
  );
  assertEqual(
    getAuthCallbackParameters("not a deep link").errorMessage,
    "This sign-in link is invalid. Please request a new one.",
    "malformed callbacks must produce a safe, actionable error",
  );
}

export function testAuthCallbackSurfacesExpiredLinkErrorsWithoutCredentials(): void {
  assertEqual(
    getAuthCallbackParameters(
      "lumomobile://auth/callback?error=access_denied&error_description=Email+link+is+invalid+or+has+expired",
    ).errorMessage,
    "Email link is invalid or has expired",
    "Supabase expiry responses must reach the callback screen as actionable errors",
  );
}
