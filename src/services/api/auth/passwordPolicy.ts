export const MIN_PASSWORD_LENGTH = 6;

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Use at least 6 characters, including a lowercase letter, uppercase letter, number, and symbol.";

/** Mirrors the configured Supabase password composition policy. */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return PASSWORD_REQUIREMENTS_MESSAGE;
  }

  if (
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return PASSWORD_REQUIREMENTS_MESSAGE;
  }

  return null;
}
