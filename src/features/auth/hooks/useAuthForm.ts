/**
 * Auth Form Hook
 *
 * Manages email/password form state for login and signup.
 * Validates required fields, exposes loading/error/success state.
 * Calls auth service methods, never calls Supabase directly.
 */

import { useState } from "react";
import {
    signInWithEmailPassword,
    signUpWithEmailPassword,
} from "../../../services/api/auth/supabaseAuth.session";
import { mapSupabaseSessionToAuthUser } from "../../../services/api/auth/supabaseAuth.mapper";
import {
    beginGuestUpgrade,
    finalizeGuestUpgrade,
} from "../services/authTransitionOrchestrator";
import { useAuthSessionStore } from "../store/useAuthSessionStore";
import { normalizeAuthError } from "../utils/authErrorMessages";
import { validateEmailPassword } from "../utils/authFormValidation";
import { getSignupOutcome } from "../utils/signupOutcome";

export function useAuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setAuthenticatedSession = useAuthSessionStore(
    (s) => s.setAuthenticatedSession,
  );
  const localOwnerId = useAuthSessionStore((s) => s.localOwnerId);

  const setEmailValue = (value: string) => {
    setEmail(value);
    setError(null);
    setConfirmationMessage(null);
  };

  const setPasswordValue = (value: string) => {
    setPassword(value);
    setError(null);
    setConfirmationMessage(null);
  };

  const validateForm = (): boolean => {
    const validationError = validateEmailPassword(email, password);
    if (validationError) {
      setError(validationError);
      return false;
    }
    return true;
  };

  const signIn = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setConfirmationMessage(null);
    setSuccess(false);

    try {
      const result = await signInWithEmailPassword(email, password);

      if (!result.success || !result.data || !result.data.user) {
        const errorMessage = result.error?.message || "Sign in failed";
        setError(normalizeAuthError(errorMessage));
        return;
      }

      // Successful sign in
      const session = result.data;
      const cloudOwnerId = session.user?.id;
      const effectiveLocalOwnerId = localOwnerId || "guest";
      const authUser = mapSupabaseSessionToAuthUser(session, effectiveLocalOwnerId);

      if (!cloudOwnerId || !authUser) {
        setError("Sign in failed. Please try again.");
        return;
      }

      // Begin guest upgrade transition
      beginGuestUpgrade(effectiveLocalOwnerId, cloudOwnerId);

      // Update auth session store
      setAuthenticatedSession(effectiveLocalOwnerId, cloudOwnerId, authUser);

      // Finalize guest upgrade transition
      finalizeGuestUpgrade();

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(normalizeAuthError(message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const signUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setConfirmationMessage(null);
    setSuccess(false);

    try {
      const result = await signUpWithEmailPassword(email, password);

      const outcome = getSignupOutcome(result);
      if (outcome.status === "failed") {
        setError(normalizeAuthError(outcome.message));
        return;
      }

      if (outcome.status === "confirmation_required") {
        setConfirmationMessage("Check your email to confirm your account, then sign in.");
        return;
      }

      // Successful sign up
      const session = outcome.session;
      const cloudOwnerId = session.user?.id;
      const effectiveLocalOwnerId = localOwnerId || "guest";
      const authUser = mapSupabaseSessionToAuthUser(session, effectiveLocalOwnerId);

      if (!cloudOwnerId || !authUser) {
        setError("Sign up failed. Please try again.");
        return;
      }

      // Begin guest upgrade transition
      beginGuestUpgrade(effectiveLocalOwnerId, cloudOwnerId);

      // Update auth session store
      setAuthenticatedSession(effectiveLocalOwnerId, cloudOwnerId, authUser);

      // Finalize guest upgrade transition
      finalizeGuestUpgrade();

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(normalizeAuthError(message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setEmail("");
    setPassword("");
    setError(null);
    setConfirmationMessage(null);
    setSuccess(false);
    setIsSubmitting(false);
  };

  return {
    email,
    password,
    setEmail: setEmailValue,
    setPassword: setPasswordValue,
    isSubmitting,
    error,
    confirmationMessage,
    success,
    signIn,
    signUp,
    reset,
  };
}
