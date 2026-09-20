/**
 * Supabase Auth Session
 *
 * Session management layer for Supabase auth.
 * Handles session lifecycle, restoration, and auth state changes.
 *
 * Never import this directly outside src/services/api/auth/
 * Use the session.ts and mapper.ts abstractions instead.
 */

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import { clearRecoverySession, hasRecoverySession } from "./recoverySessionGuard";
import { getSupabaseClient } from "./supabaseAuth.client";
import { getAuthRedirectUrl } from "./authRedirect";
import {
  getAuthCallbackIntent,
  getAuthCallbackParameters,
} from "./authCallbackIntent";
import { validatePassword } from "./passwordPolicy";
import { mapSignupResponse } from "./signupResponse";
import type {
    SupabaseAuthError,
    SupabaseAuthResult,
    SupabaseAuthSession,
} from "./supabaseAuth.types";

/**
 * Get the current Supabase session.
 *
 * @returns Supabase session result
 */
export async function getCurrentSession(): Promise<
  SupabaseAuthResult<SupabaseAuthSession>
> {
  const client = getSupabaseClient();

  if (!client) {
    const error: SupabaseAuthError = {
      type: "config_missing",
      message: "Supabase client not available",
    };
    return { success: false, error };
  }

  try {
    const { data, error: sessionError } = await client.auth.getSession();

    if (sessionError) {
      const error: SupabaseAuthError = {
        type: "auth_error",
        message: sessionError.message,
        code: sessionError.status?.toString(),
      };
      return { success: false, error };
    }

    const session = data.session;
    const user = session?.user ?? null;

    // Check if session is valid and not expired
    const isValid =
      session !== null &&
      session.expires_at !== undefined &&
      session.expires_at !== null
        ? session.expires_at * 1000 > Date.now()
        : session !== null;

    const authSession: SupabaseAuthSession = {
      session,
      user,
      isValid,
      expiresAt: session?.expires_at ? session.expires_at * 1000 : null,
    };

    return { success: true, data: authSession };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const error: SupabaseAuthError = {
      type: "unknown_error",
      message: `Failed to get session: ${message}`,
    };
    return { success: false, error };
  }
}

/**
 * Refresh the current Supabase session.
 *
 * @returns Refreshed session result
 */
export async function refreshSession(): Promise<
  SupabaseAuthResult<SupabaseAuthSession>
> {
  const client = getSupabaseClient();

  if (!client) {
    const error: SupabaseAuthError = {
      type: "config_missing",
      message: "Supabase client not available",
    };
    return { success: false, error };
  }

  try {
    const { data, error: refreshError } = await client.auth.refreshSession();

    if (refreshError) {
      const error: SupabaseAuthError = {
        type: "auth_error",
        message: refreshError.message,
        code: refreshError.status?.toString(),
      };
      return { success: false, error };
    }

    const session = data.session;
    const user = session?.user ?? null;

    const isValid =
      session !== null &&
      session.expires_at !== undefined &&
      session.expires_at !== null
        ? session.expires_at * 1000 > Date.now()
        : session !== null;

    const authSession: SupabaseAuthSession = {
      session,
      user,
      isValid,
      expiresAt: session?.expires_at ? session.expires_at * 1000 : null,
    };

    return { success: true, data: authSession };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const error: SupabaseAuthError = {
      type: "unknown_error",
      message: `Failed to refresh session: ${message}`,
    };
    return { success: false, error };
  }
}

/**
 * Sign out the current session.
 *
 * @returns Sign out result
 */
export async function signOutSession(): Promise<SupabaseAuthResult<void>> {
  const client = getSupabaseClient();

  if (!client) {
    const error: SupabaseAuthError = {
      type: "config_missing",
      message: "Supabase client not available",
    };
    return { success: false, error };
  }

  try {
    const { error: signOutError } = await client.auth.signOut();

    if (signOutError) {
      const error: SupabaseAuthError = {
        type: "auth_error",
        message: signOutError.message,
        code: signOutError.status?.toString(),
      };
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const error: SupabaseAuthError = {
      type: "unknown_error",
      message: `Failed to sign out: ${message}`,
    };
    return { success: false, error };
  }
}

/**
 * Restore a persisted session from storage.
 * This is called on app startup to restore the user's session.
 *
 * @returns Restored session result
 */
export async function restorePersistedSession(): Promise<
  SupabaseAuthResult<SupabaseAuthSession>
> {
  const client = getSupabaseClient();

  if (!client) {
    const error: SupabaseAuthError = {
      type: "config_missing",
      message: "Supabase client not available",
    };
    return { success: false, error };
  }

  try {
    const { data, error: sessionError } = await client.auth.getSession();

    if (sessionError) {
      const error: SupabaseAuthError = {
        type: "auth_error",
        message: sessionError.message,
        code: sessionError.status?.toString(),
      };
      return { success: false, error };
    }

    const session = data.session;
    const user = session?.user ?? null;

    // If no session exists, that's not an error - just return null
    if (!session) {
      const authSession: SupabaseAuthSession = {
        session: null,
        user: null,
        isValid: false,
        expiresAt: null,
      };
      return { success: true, data: authSession };
    }

    // Check if session is expired
    const isValid =
      session.expires_at !== undefined && session.expires_at !== null
        ? session.expires_at * 1000 > Date.now()
        : true;

    const authSession: SupabaseAuthSession = {
      session,
      user,
      isValid,
      expiresAt: session.expires_at ? session.expires_at * 1000 : null,
    };

    return { success: true, data: authSession };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const error: SupabaseAuthError = {
      type: "unknown_error",
      message: `Failed to restore session: ${message}`,
    };
    return { success: false, error };
  }
}

/**
 * Subscribe to auth state changes.
 * Returns a subscription object that can be used to unsubscribe.
 *
 * @param callback - Callback function for auth changes
 * @returns Subscription object with unsubscribe method
 */
export function subscribeToAuthChanges(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): { unsubscribe: () => void } {
  const client = getSupabaseClient();

  if (!client) {
    console.warn("[SupabaseSession] Cannot subscribe: client not available");
    return { unsubscribe: () => {} };
  }

  const { data } = client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return {
    unsubscribe: () => {
      data.subscription.unsubscribe();
    },
  };
}

/**
 * Sign in with email and password.
 *
 * @param email - User email
 * @param password - User password
 * @returns Sign in result with session
 */
export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<SupabaseAuthResult<SupabaseAuthSession>> {
  const client = getSupabaseClient();

  if (!client) {
    const error: SupabaseAuthError = {
      type: "config_missing",
      message: "Supabase client not available",
    };
    return { success: false, error };
  }

  try {
    const { data, error: signInError } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      const error: SupabaseAuthError = {
        type: "auth_error",
        message: signInError.message,
        code: signInError.status?.toString(),
      };
      return { success: false, error };
    }

    const session = data.session;
    const user = session?.user ?? null;

    const isValid =
      session !== null &&
      session.expires_at !== undefined &&
      session.expires_at !== null
        ? session.expires_at * 1000 > Date.now()
        : session !== null;

    const authSession: SupabaseAuthSession = {
      session,
      user,
      isValid,
      expiresAt: session?.expires_at ? session.expires_at * 1000 : null,
    };

    return { success: true, data: authSession };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const error: SupabaseAuthError = {
      type: "unknown_error",
      message: `Failed to sign in: ${message}`,
    };
    return { success: false, error };
  }
}

/**
 * Sign up with email and password.
 *
 * @param email - User email
 * @param password - User password
 * @returns Sign up result with session
 */
export async function signUpWithEmailPassword(
  email: string,
  password: string,
): Promise<SupabaseAuthResult<SupabaseAuthSession>> {
  const client = getSupabaseClient();

  if (!client) {
    const error: SupabaseAuthError = {
      type: "config_missing",
      message: "Supabase client not available",
    };
    return { success: false, error };
  }

  try {
    const { data, error: signUpError } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });

    if (signUpError) {
      const error: SupabaseAuthError = {
        type: "auth_error",
        message: signUpError.message,
        code: signUpError.status?.toString(),
      };
      return { success: false, error };
    }

    return { success: true, data: mapSignupResponse(data) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const error: SupabaseAuthError = {
      type: "unknown_error",
      message: `Failed to sign up: ${message}`,
    };
    return { success: false, error };
  }
}

/** Send a password-recovery email to Lumo's mobile callback route. */
export async function sendPasswordRecoveryEmail(email: string): Promise<SupabaseAuthResult<void>> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: { type: "config_missing", message: "Supabase client not available" } };
  }
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirectUrl(),
  });
  return error
    ? { success: false, error: { type: "auth_error", message: error.message, code: error.status?.toString() } }
    : { success: true };
}

/** Establish a session from a Supabase deep-link callback. */
export async function establishSessionFromAuthCallback(url: string): Promise<SupabaseAuthResult<SupabaseAuthSession>> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: { type: "config_missing", message: "Supabase client not available" } };
  }

  const callback = getAuthCallbackParameters(url);
  if (callback.errorMessage) {
    return { success: false, error: { type: "auth_error", message: callback.errorMessage } };
  }

  let authEvent: AuthChangeEvent | null = null;
  const { data: listener } = client.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") authEvent = event;
  });

  let result;
  try {
    result = callback.code
      ? await client.auth.exchangeCodeForSession(callback.code)
      : callback.accessToken && callback.refreshToken
        ? await client.auth.setSession({ access_token: callback.accessToken, refresh_token: callback.refreshToken })
        : { data: { session: null, user: null }, error: new Error("The sign-in link did not include a session.") };
  } finally {
    listener.subscription.unsubscribe();
  }

  if (result.error || !result.data.session || !result.data.user) {
    return { success: false, error: { type: "auth_error", message: result.error?.message ?? "Unable to establish a session" } };
  }
  return {
    success: true,
    data: {
      session: result.data.session,
      user: result.data.user,
      isValid: true,
      expiresAt: result.data.session.expires_at ? result.data.session.expires_at * 1000 : null,
      callbackIntent: getAuthCallbackIntent(url, authEvent),
    },
  };
}

/** Identifies a callback without exposing any token values to callers or logs. */
export { getAuthCallbackIntent } from "./authCallbackIntent";

/** Updates a password only when Supabase has an active recovery/auth session. */
export async function updatePasswordFromRecoverySession(password: string): Promise<SupabaseAuthResult<void>> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: { type: "config_missing", message: "Supabase client not available" } };
  const passwordError = validatePassword(password);
  if (passwordError) {
    return { success: false, error: { type: "auth_error", message: passwordError } };
  }
  if (!hasRecoverySession()) {
    return { success: false, error: { type: "auth_error", message: "Open a new recovery link before choosing a password." } };
  }

  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError || !sessionData.session) {
    return { success: false, error: { type: "auth_error", message: "Your recovery link has expired. Please request a new one." } };
  }
  const { error } = await client.auth.updateUser({ password });
  if (error) {
    return { success: false, error: { type: "auth_error", message: error.message, code: error.status?.toString() } };
  }
  clearRecoverySession();
  return { success: true };
}
