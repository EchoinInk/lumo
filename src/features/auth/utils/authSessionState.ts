import type {
  AccountMode,
  AuthSessionState,
  AuthTransitionState,
  AuthUser,
  CloudOwnerId,
  LocalOwnerId,
} from "../types/auth.types";

export interface AuthenticatedSessionSnapshot {
  accountMode: AccountMode;
  localOwnerId: LocalOwnerId;
  cloudOwnerId: CloudOwnerId;
  authUser: AuthUser;
  sessionStatus: AuthSessionState;
  transitionStatus: AuthTransitionState;
  hasHydrated: boolean;
  authHydrationStatus: "hydrated";
  authError: null;
}

/** A completed auth response is sufficient to settle route guards immediately. */
export function createAuthenticatedSessionSnapshot(
  localOwnerId: LocalOwnerId,
  cloudOwnerId: CloudOwnerId,
  authUser: AuthUser,
): AuthenticatedSessionSnapshot {
  return {
    accountMode: "authenticated",
    localOwnerId,
    cloudOwnerId,
    authUser,
    sessionStatus: "authenticated",
    transitionStatus: "idle",
    hasHydrated: true,
    authHydrationStatus: "hydrated",
    authError: null,
  };
}

export function isAuthSessionLoading(
  hasHydrated: boolean,
  sessionStatus: AuthSessionState,
): boolean {
  return !hasHydrated || sessionStatus === "initializing";
}
