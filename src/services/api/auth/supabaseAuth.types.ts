/**
 * Supabase Auth Types
 *
 * Internal types for Supabase auth integration.
 * These types are mapped to/from canonical auth types in the mapper.
 *
 * No Supabase types should escape this layer.
 * All external code uses canonical types from src/features/auth/types/auth.types.ts
 */

import type { Session, User } from "@supabase/supabase-js";
import type { AuthCallbackIntent } from "./authCallbackIntent";

/**
 * Internal Supabase session wrapper.
 * Never exposed outside auth layer.
 */
export interface SupabaseAuthSession {
  /** Raw Supabase session */
  session: Session | null;
  /** Raw Supabase user */
  user: User | null;
  /** Whether session is valid and not expired */
  isValid: boolean;
  /** Session expiration timestamp */
  expiresAt: number | null;
  /** True when Supabase created a user but requires email confirmation first. */
  requiresEmailConfirmation?: boolean;
  /** Intent resolved from the authenticated email callback, when applicable. */
  callbackIntent?: AuthCallbackIntent;
}

/**
 * Supabase auth error types.
 * Used for internal error handling before mapping to app errors.
 */
export type SupabaseAuthError =
  | { type: "config_missing"; message: string }
  | { type: "session_expired"; message: string }
  | { type: "session_invalid"; message: string }
  | { type: "network_error"; message: string }
  | { type: "auth_error"; message: string; code?: string }
  | { type: "unknown_error"; message: string };

/**
 * Result of a Supabase auth operation.
 */
export interface SupabaseAuthResult<T> {
  success: boolean;
  data?: T;
  error?: SupabaseAuthError;
}

/**
 * Supabase auth configuration.
 */
export interface SupabaseAuthConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}
