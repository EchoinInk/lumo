import type { AuthUser } from "../types/auth.types";

/** Returns the authenticated email exactly as Account should present it. */
export function getAccountEmailDisplay(authUser: AuthUser | null): string {
  return authUser?.email ?? "No email";
}
