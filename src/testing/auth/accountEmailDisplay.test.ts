import { mapSupabaseUserToAuthUser } from "@/services/api/auth/supabaseAuth.mapper";
import { getAccountEmailDisplay } from "@/features/auth/utils/accountEmailDisplay";
import { assertEqual } from "../testUtils";

export function testAuthenticatedUserEmailIsMappedForAccountDisplay(): void {
  const localOwnerId = "local-account-email";
  const cloudOwnerId = "cloud-account-email";
  const authUser = mapSupabaseUserToAuthUser(
    {
      id: cloudOwnerId,
      email: "account@example.com",
      created_at: "2026-01-01T00:00:00.000Z",
      user_metadata: {},
    } as never,
    localOwnerId,
  );

  assertEqual(
    getAccountEmailDisplay(authUser),
    "account@example.com",
    "Account must display the canonical email for an authenticated Supabase user",
  );
}
