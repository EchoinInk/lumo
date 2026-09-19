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
import {
    beginGuestUpgrade,
    finalizeGuestUpgrade,
} from "../services/authTransitionOrchestrator";
import { useAuthSessionStore } from "../store/useAuthSessionStore";

export function useAuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setAuthenticatedSession = useAuthSessionStore(
    (s) => s.setAuthenticatedSession,
  );
  const localOwnerId = useAuthSessionStore((s) => s.localOwnerId);

  const validateForm = (): boolean => {
    if (!email || email.trim().length === 0) {
      setError("Please enter your email");
      return false;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return false;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const normalizeError = (message: string): string => {
    // Normalize Supabase errors into calm user-facing messages
    if (message.includes("Invalid login credentials")) {
      return "We couldn't sign you in. Please check your email and password.";
    }

    if (message.includes("User already registered")) {
      return "An account with this email already exists. Please sign in instead.";
    }

    if (message.includes("Email not confirmed")) {
      return "Please confirm your email address before signing in.";
    }

    if (message.includes("Password should be")) {
      return "Password must be at least 6 characters.";
    }

    // Default fallback
    return "Something went wrong. Please try again.";
  };

  const signIn = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await signInWithEmailPassword(email, password);

      if (!result.success || !result.data || !result.data.user) {
        const errorMessage = result.error?.message || "Sign in failed";
        setError(normalizeError(errorMessage));
        return;
      }

      // Successful sign in
      const session = result.data;
      const cloudOwnerId = session.user?.id;

      if (!cloudOwnerId) {
        setError("Sign in failed. Please try again.");
        return;
      }

      // Begin guest upgrade transition
      beginGuestUpgrade(localOwnerId || "guest", cloudOwnerId);

      // Update auth session store
      setAuthenticatedSession(localOwnerId || "guest", cloudOwnerId);

      // Finalize guest upgrade transition
      finalizeGuestUpgrade();

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(normalizeError(message));
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
    setSuccess(false);

    try {
      const result = await signUpWithEmailPassword(email, password);

      if (!result.success || !result.data || !result.data.user) {
        const errorMessage = result.error?.message || "Sign up failed";
        setError(normalizeError(errorMessage));
        return;
      }

      if (!result.data.isValid) {
        setError("Check your email to confirm your account, then sign in.");
        return;
      }

      // Successful sign up
      const session = result.data;
      const cloudOwnerId = session.user?.id;

      if (!cloudOwnerId) {
        setError("Sign up failed. Please try again.");
        return;
      }

      // Begin guest upgrade transition
      beginGuestUpgrade(localOwnerId || "guest", cloudOwnerId);

      // Update auth session store
      setAuthenticatedSession(localOwnerId || "guest", cloudOwnerId);

      // Finalize guest upgrade transition
      finalizeGuestUpgrade();

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(normalizeError(message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setEmail("");
    setPassword("");
    setError(null);
    setSuccess(false);
    setIsSubmitting(false);
  };

  return {
    email,
    password,
    setEmail,
    setPassword,
    isSubmitting,
    error,
    success,
    signIn,
    signUp,
    reset,
  };
}
