import {
  beginRecoverySession,
  clearRecoverySession,
  hasRecoverySession,
} from "@/services/api/auth/recoverySessionGuard";
import { getAuthCallbackIntent } from "@/services/api/auth/authCallbackIntent";
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
