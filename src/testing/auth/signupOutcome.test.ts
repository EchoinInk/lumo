import { getSignupOutcome } from "@/features/auth/utils/signupOutcome";
import { normalizeAuthError } from "@/features/auth/utils/authErrorMessages";
import {
  validateEmailPassword,
} from "@/features/auth/utils/authFormValidation";
import {
  PASSWORD_REQUIREMENTS_MESSAGE,
  validatePassword,
} from "@/services/api/auth/passwordPolicy";
import { mapSignupResponse } from "@/services/api/auth/signupResponse";
import { assertEqual } from "../testUtils";

export function testConfirmationRequiredSignupIsNotTreatedAsFailure(): void {
  const session = mapSignupResponse({
    session: null,
    user: { id: "user-confirmation" } as never,
  });
  const outcome = getSignupOutcome({ success: true, data: session });

  assertEqual(
    outcome.status,
    "confirmation_required",
    "a signup user without a session must prompt for email confirmation",
  );
}

export function testSignupWithoutUserIsAFailure(): void {
  const outcome = getSignupOutcome({
    success: true,
    data: {
      session: null,
      user: null,
      isValid: false,
      expiresAt: null,
    },
  });

  assertEqual(outcome.status, "failed", "a missing signup user must remain an error");
}

export function testPasswordPolicyRequiresEveryConfiguredCharacterClass(): void {
  assertEqual(
    validateEmailPassword("alex@example.com", "12345678Abc#"),
    null,
    "a password meeting every requirement must be eligible for submission",
  );
  assertEqual(
    validatePassword("1234567890"),
    PASSWORD_REQUIREMENTS_MESSAGE,
    "a password without letters or symbols should be blocked locally",
  );
  assertEqual(
    validatePassword("abcdefgh#1"),
    PASSWORD_REQUIREMENTS_MESSAGE,
    "a password without an uppercase letter should be blocked locally",
  );
  assertEqual(
    validatePassword("Abcdefgh#1"),
    null,
    "a password with every required character class should pass",
  );
}

export function testBackendPasswordPolicyErrorUsesTheSameAccessibleMessage(): void {
  assertEqual(
    normalizeAuthError(
      "Password should contain at least one character of each: lowercase, uppercase, numbers and symbols.",
    ),
    PASSWORD_REQUIREMENTS_MESSAGE,
    "a Supabase 422 password policy error should not become a generic error",
  );
}
