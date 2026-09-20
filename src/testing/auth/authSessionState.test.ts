import { mapSupabaseUserToAuthUser } from "@/services/api/auth/supabaseAuth.mapper";
import {
  createAuthenticatedSessionSnapshot,
  isAuthSessionLoading,
} from "@/features/auth/utils/authSessionState";
import { assertEqual } from "../testUtils";

export function testAuthenticatedTransitionSettlesAccountRouteLoading(): void {
  const localOwnerId = "local-loading-regression";
  const cloudOwnerId = "cloud-loading-regression";
  const authUser = mapSupabaseUserToAuthUser(
    {
      id: cloudOwnerId,
      email: "account@example.com",
      created_at: "2026-01-01T00:00:00.000Z",
      user_metadata: {},
    } as never,
    localOwnerId,
  );
  const session = createAuthenticatedSessionSnapshot(
    localOwnerId,
    cloudOwnerId,
    authUser,
  );

  assertEqual(session.hasHydrated, true, "a completed sign-in must settle hydration");
  assertEqual(
    isAuthSessionLoading(session.hasHydrated, session.sessionStatus),
    false,
    "AuthGuard must not keep Account on Loading after an authenticated transition",
  );
}
