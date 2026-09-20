import { validatePassword } from "@/services/api/auth/passwordPolicy";

export { validatePassword } from "@/services/api/auth/passwordPolicy";

export function validateEmailPassword(
  email: string,
  password: string,
): string | null {
  if (!email || email.trim().length === 0) {
    return "Please enter your email";
  }

  if (!email.includes("@")) {
    return "Please enter a valid email";
  }

  return validatePassword(password);
}
