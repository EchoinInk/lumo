/**
 * Auth Session Store
 *
 * Zustand store for auth session state and ownership identity.
 * Wired to Supabase Auth for session management.
 *
 * Responsibilities:
 * - Track current account mode (guest vs authenticated)
 * - Maintain stable localOwnerId for guest mode
 * - Maintain cloudOwnerId for authenticated mode
 * - Track session and transition states
 * - Track guest migration completion status
 * - Hydrate and restore Supabase sessions
 * - Handle sign-out
 *
 * NOT responsible for:
 * - Feature entity state (owned by feature stores)
 * - Direct Supabase SDK usage (uses auth layer abstraction)
 *
 * Persisted to MMKV via Zustand persist middleware.
 * Follows existing storage patterns from createPersistStorage.
 */

import { isSupabaseConfigured } from "@/services/api/auth/auth.config";
import { mapSupabaseSessionToAuthUser } from "@/services/api/auth/supabaseAuth.mapper";
import {
    restorePersistedSession,
    signOutSession,
} from "@/services/api/auth/supabaseAuth.session";
import { createPersistStorage } from "@/store/createPersistStorage";
import {
    createAuthenticatedSessionSnapshot,
    isAuthSessionLoading,
} from "../utils/authSessionState";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
    AccountMode,
    AuthSessionState,
    AuthTransitionState,
    AuthUser,
    CloudOwnerId,
    LocalOwnerId,
} from "../types/auth.types";

// ── Helpers ─────────────────────────────────────────────────────────────────────

/**
 * Generate a stable local owner ID.
 * In production, this should be preserved from storage or generated once.
 */
function generateLocalOwnerId(): LocalOwnerId {
  return `local-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ── State ─────────────────────────────────────────────────────────────────────

interface AuthSessionStoreState {
  /** Current account mode */
  accountMode: AccountMode;
  /** Stable local owner ID (always present) */
  localOwnerId: LocalOwnerId | null;
  /** Cloud owner ID (present only when authenticated) */
  cloudOwnerId: CloudOwnerId | null;
  /** Current session lifecycle state */
  sessionStatus: AuthSessionState;
  /** Current account transition state */
  transitionStatus: AuthTransitionState;
  /** True once guest → account migration has completed */
  hasCompletedGuestMigration: boolean;
  /** True once the store has hydrated from storage */
  hasHydrated: boolean;
  /** Authenticated user data (present when authenticated) */
  authUser: AuthUser | null;
  /** Timestamp of last session restore */
  lastSessionRestoreAt: string | null;
  /** Auth hydration status for offline-safe restoration */
  authHydrationStatus: "pending" | "hydrating" | "hydrated" | "failed";
  /** Optional auth error for graceful degradation */
  authError: string | null;
}

// ── Actions ───────────────────────────────────────────────────────────────────

interface AuthSessionActions {
  /** Set hasHydrated flag (called by persist middleware) */
  setHasHydrated: (value: boolean) => void;

  /**
   * Initialize guest session.
   * Generates or restores a stable localOwnerId.
   */
  setGuestSession: (localOwnerId: LocalOwnerId) => void;

  /**
   * Set authenticated session.
   * Requires both localOwnerId (from guest state) and cloudOwnerId (from Supabase).
   */
  setAuthenticatedSession: (
    localOwnerId: LocalOwnerId,
    cloudOwnerId: CloudOwnerId,
    authUser: AuthUser,
  ) => void;

  /**
   * Begin guest → account migration.
   * Sets transition status to 'preparing'.
   */
  beginAccountTransition: () => void;

  /**
   * Complete guest → account migration.
   * Sets transition status to 'completed' and marks migration as done.
   */
  completeAccountTransition: () => void;

  /**
   * Reset auth session to initial state.
   * Used for sign-out or testing.
   */
  resetAuthSession: () => void;

  /**
   * Hydrate auth session from Supabase.
   * Restores persisted session or initializes guest mode.
   */
  hydrateSession: () => Promise<void>;

  /**
   * Restore auth session from storage.
   * Called on app startup.
   */
  restoreSession: () => Promise<void>;

  /**
   * Sign out current session.
   * Clears Supabase session and resets to guest mode.
   */
  signOut: () => Promise<void>;

  /**
   * Set session hydrating status.
   */
  setSessionHydrating: () => void;

  /**
   * Set session ready status.
   */
  setSessionReady: () => void;

  /**
   * Set session error.
   */
  setSessionError: (error: string) => void;
}

type AuthSessionStore = AuthSessionStoreState & AuthSessionActions;

// ── Initial State ─────────────────────────────────────────────────────────────

const initialState: AuthSessionStoreState = {
  accountMode: "guest",
  localOwnerId: null,
  cloudOwnerId: null,
  sessionStatus: "initializing",
  transitionStatus: "idle",
  hasCompletedGuestMigration: false,
  hasHydrated: false,
  authUser: null,
  lastSessionRestoreAt: null,
  authHydrationStatus: "pending",
  authError: null,
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthSessionStore = create<AuthSessionStore>()(
  persist(
    (set) => ({
      ...initialState,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      setGuestSession: (localOwnerId) =>
        set({
          accountMode: "guest",
          localOwnerId,
          cloudOwnerId: null,
          sessionStatus: "guest",
          transitionStatus: "idle",
        }),

      setAuthenticatedSession: (localOwnerId, cloudOwnerId, authUser) =>
        set(createAuthenticatedSessionSnapshot(localOwnerId, cloudOwnerId, authUser)),

      beginAccountTransition: () =>
        set({
          transitionStatus: "preparing",
          sessionStatus: "transitioning",
        }),

      completeAccountTransition: () =>
        set({
          transitionStatus: "completed",
          sessionStatus: "authenticated",
          hasCompletedGuestMigration: true,
        }),

      resetAuthSession: () =>
        set({
          ...initialState,
          sessionStatus: "signed_out",
        }),

      hydrateSession: async () => {
        set({
          authHydrationStatus: "hydrating",
          sessionStatus: "initializing",
        });

        // If Supabase is not configured, immediately initialize guest mode
        if (!isSupabaseConfigured()) {
          console.warn(
            "[AuthSessionStore] Supabase not configured, initializing guest mode",
          );
          const localOwnerId = generateLocalOwnerId();
          set({
            accountMode: "guest",
            localOwnerId,
            cloudOwnerId: null,
            sessionStatus: "guest",
            authHydrationStatus: "hydrated",
            authError: null,
          });
          return;
        }

        try {
          const result = await restorePersistedSession();

          if (!result.success || !result.data) {
            // No session or failed to restore - initialize guest mode
            const localOwnerId = generateLocalOwnerId();
            set({
              accountMode: "guest",
              localOwnerId,
              cloudOwnerId: null,
              sessionStatus: "guest",
              authHydrationStatus: "hydrated",
              authError: null,
            });
            return;
          }

          const session = result.data;

          if (!session.isValid || !session.user) {
            // Session expired or invalid - initialize guest mode
            const localOwnerId = generateLocalOwnerId();
            set({
              accountMode: "guest",
              localOwnerId,
              cloudOwnerId: null,
              sessionStatus: "guest",
              authHydrationStatus: "hydrated",
              authError: null,
            });
            return;
          }

          // Valid session - set authenticated mode
          const localOwnerId = generateLocalOwnerId(); // TODO: Preserve from guest state
          const cloudOwnerId = session.user.id as CloudOwnerId;
          const authUser = mapSupabaseSessionToAuthUser(session, localOwnerId);

          set({
            accountMode: "authenticated",
            localOwnerId,
            cloudOwnerId,
            sessionStatus: "authenticated",
            authUser,
            lastSessionRestoreAt: new Date().toISOString(),
            authHydrationStatus: "hydrated",
            authError: null,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[AuthSessionStore] Failed to hydrate session:", err);
          // Always fail open to guest mode on error
          const localOwnerId = generateLocalOwnerId();
          set({
            accountMode: "guest",
            localOwnerId,
            cloudOwnerId: null,
            sessionStatus: "guest",
            authHydrationStatus: "hydrated",
            authError: message,
          });
        }
      },

      restoreSession: async () => {
        set({ authHydrationStatus: "hydrating" });

        try {
          const result = await restorePersistedSession();

          if (!result.success || !result.data) {
            set({
              authHydrationStatus: "hydrated",
              sessionStatus: "guest",
            });
            return;
          }

          const session = result.data;

          if (!session.isValid || !session.user) {
            set({
              authHydrationStatus: "hydrated",
              sessionStatus: "guest",
            });
            return;
          }

          const localOwnerId = generateLocalOwnerId();
          const cloudOwnerId = session.user.id as CloudOwnerId;
          const authUser = mapSupabaseSessionToAuthUser(session, localOwnerId);

          set({
            accountMode: "authenticated",
            localOwnerId,
            cloudOwnerId,
            sessionStatus: "authenticated",
            authUser,
            lastSessionRestoreAt: new Date().toISOString(),
            authHydrationStatus: "hydrated",
          });
        } catch (err) {
          console.error("[AuthSessionStore] Failed to restore session:", err);
          set({
            authHydrationStatus: "failed",
            sessionStatus: "guest",
          });
        }
      },

      signOut: async () => {
        try {
          await signOutSession();
        } catch (err) {
          console.error("[AuthSessionStore] Failed to sign out:", err);
        }

        // Reset to guest mode
        const localOwnerId = generateLocalOwnerId();
        set({
          accountMode: "guest",
          localOwnerId,
          cloudOwnerId: null,
          sessionStatus: "guest",
          authUser: null,
          transitionStatus: "idle",
          authError: null,
        });
      },

      setSessionHydrating: () =>
        set({
          authHydrationStatus: "hydrating",
          sessionStatus: "initializing",
        }),

      setSessionReady: () =>
        set({
          authHydrationStatus: "hydrated",
          sessionStatus: "authenticated",
        }),

      setSessionError: (error) =>
        set({
          authError: error,
          authHydrationStatus: "failed",
        }),
    }),
    {
      name: "auth-session-storage",
      storage: createJSONStorage(() => createPersistStorage()),
      partialize: (state) => ({
        accountMode: state.accountMode,
        localOwnerId: state.localOwnerId,
        cloudOwnerId: state.cloudOwnerId,
        hasCompletedGuestMigration: state.hasCompletedGuestMigration,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

// ── Selectors ─────────────────────────────────────────────────────────────────

/** True when the user is in guest mode. */
export const selectIsGuest = (state: AuthSessionStoreState): boolean =>
  state.accountMode === "guest";

/** True when the user is authenticated. */
export const selectIsAuthenticated = (state: AuthSessionStoreState): boolean =>
  state.accountMode === "authenticated" && state.cloudOwnerId !== null;

/** True when a migration is in progress. */
export const selectIsMigrating = (state: AuthSessionStoreState): boolean =>
  state.transitionStatus !== "idle" &&
  state.transitionStatus !== "completed" &&
  state.transitionStatus !== "failed";

/** True when the session has not yet hydrated from storage. */
export const selectIsLoading = (state: AuthSessionStoreState): boolean =>
  isAuthSessionLoading(state.hasHydrated, state.sessionStatus);

/** True when the session is settled (not loading or transitioning). */
export const selectIsSettled = (state: AuthSessionStoreState): boolean =>
  state.hasHydrated &&
  state.sessionStatus !== "initializing" &&
  state.sessionStatus !== "transitioning";
