import { PASSWORD_REQUIREMENTS_MESSAGE } from "@/services/api/auth/passwordPolicy";

/** Maps Supabase Auth responses to concise, non-sensitive UI copy. */
export function normalizeAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "We couldn't sign you in. Please check your email and password.";
  }

  if (message.includes("User already registered")) {
    return "An account with this email already exists. Please sign in instead.";
  }

  if (message.includes("Email not confirmed")) {
    return "Please confirm your email address before signing in.";
  }

  if (
    message.includes("Password should contain") ||
    message.includes("Password must contain") ||
    message.includes("Password should be")
  ) {
    return PASSWORD_REQUIREMENTS_MESSAGE;
  }

  return "Something went wrong. Please try again.";
}
