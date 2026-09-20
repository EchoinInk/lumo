import type { SupabaseAuthResult, SupabaseAuthSession } from "@/services/api/auth/supabaseAuth.types";

export type SignupOutcome =
  | { status: "authenticated"; session: SupabaseAuthSession }
  | { status: "confirmation_required" }
  | { status: "failed"; message: string };

/**
 * Keeps a confirmation-required Supabase response distinct from a failed signup.
 * Supabase intentionally returns a user with no session when email confirmation
 * is enabled.
 */
export function getSignupOutcome(
  result: SupabaseAuthResult<SupabaseAuthSession>,
): SignupOutcome {
  if (!result.success || !result.data || !result.data.user) {
    return { status: "failed", message: result.error?.message ?? "Sign up failed" };
  }

  if (result.data.requiresEmailConfirmation) {
    return { status: "confirmation_required" };
  }

  if (!result.data.isValid) {
    return { status: "failed", message: "Sign up did not establish a valid session." };
  }

  return { status: "authenticated", session: result.data };
}
