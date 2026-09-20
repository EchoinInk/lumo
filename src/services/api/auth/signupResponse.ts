import type { Session, User } from "@supabase/supabase-js";
import type { SupabaseAuthSession } from "./supabaseAuth.types";

interface SupabaseSignupResponse {
  session: Session | null;
  user: User | null;
}

/**
 * Maps Supabase's two valid signup outcomes without losing the user returned
 * for confirmation-required accounts.
 */
export function mapSignupResponse(
  data: SupabaseSignupResponse,
): SupabaseAuthSession {
  const session = data.session;
  const user = data.user ?? session?.user ?? null;
  const isValid =
    session !== null &&
    session.expires_at !== undefined &&
    session.expires_at !== null
      ? session.expires_at * 1000 > Date.now()
      : session !== null;

  return {
    session,
    user,
    isValid,
    expiresAt: session?.expires_at ? session.expires_at * 1000 : null,
    requiresEmailConfirmation: Boolean(user && !session),
  };
}
