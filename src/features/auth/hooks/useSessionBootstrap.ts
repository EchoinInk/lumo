/**
 * Offline-Safe Session Restoration Flow
 *
 * Hook for restoring persisted auth session on app startup.
 * Ensures offline-safe behavior, avoids UI flicker, and handles race conditions.
 *
 * Responsibilities:
 * - Restore persisted auth session
 * - Restore guest identity
 * - Hydrate RepositoryContext
 * - Avoid UI flicker
 * - Avoid race conditions
 * - Preserve offline startup
 *
 * Rules:
 * - App should remain usable offline
 * - Expired session should gracefully fallback
 * - Session restore should not block forever
 * - No auth modal interruptions
 */

import { useEffect, useState } from "react";
import { useAuthSessionStore } from "../store/useAuthSessionStore";

interface SessionBootstrapState {
  isRestoring: boolean;
  isReady: boolean;
  hasError: boolean;
  error?: string;
}

const HYDRATION_TIMEOUT_MS = 5000; // 5 second safety timeout

/**
 * Hook for bootstrapping auth session on app startup.
 * Call this in your root component or app entry point.
 *
 * @returns Session bootstrap state
 */
export function useSessionBootstrap(): SessionBootstrapState {
  const [state, setState] = useState<SessionBootstrapState>({
    isRestoring: true,
    isReady: false,
    hasError: false,
  });

  const hydrateSession = useAuthSessionStore((s) => s.hydrateSession);
  const authHydrationStatus = useAuthSessionStore((s) => s.authHydrationStatus);
  const authError = useAuthSessionStore((s) => s.authError);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function bootstrapSession() {
      try {
        setState({ isRestoring: true, isReady: false, hasError: false });

        // Set safety timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn(
              "[useSessionBootstrap] Hydration timeout, forcing ready state",
            );
            setState({
              isRestoring: false,
              isReady: true,
              hasError: true,
              error: "Session hydration timed out",
            });
          }
        }, HYDRATION_TIMEOUT_MS);

        // Hydrate session from Supabase or initialize guest mode
        await hydrateSession();

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (isMounted) {
          setState({
            isRestoring: false,
            isReady: true,
            hasError: false,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[useSessionBootstrap] Session restoration failed:", err);

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (isMounted) {
          setState({
            isRestoring: false,
            isReady: true, // Still ready, just in guest mode
            hasError: true,
            error: message,
          });
        }
      }
    }

    bootstrapSession();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [hydrateSession]);

  // Update state based on auth hydration status
  useEffect(() => {
    if (authHydrationStatus === "hydrated") {
      setState((prev) => ({
        ...prev,
        isRestoring: false,
        isReady: true,
        hasError: false,
      }));
    } else if (authHydrationStatus === "failed") {
      setState((prev) => ({
        ...prev,
        isRestoring: false,
        isReady: true, // Still ready, just in guest mode
        hasError: true,
        error: authError || "Session hydration failed",
      }));
    }
  }, [authHydrationStatus, authError]);

  return state;
}

/**
 * Hook to check if the session is ready for use.
 * Returns true when session hydration is complete (success or failure).
 *
 * @returns True if session is ready
 */
export function useSessionReady(): boolean {
  const authHydrationStatus = useAuthSessionStore((s) => s.authHydrationStatus);
  return authHydrationStatus === "hydrated" || authHydrationStatus === "failed";
}

/**
 * Hook to check if the session is currently restoring.
 *
 * @returns True if session is restoring
 */
export function useSessionRestoring(): boolean {
  const authHydrationStatus = useAuthSessionStore((s) => s.authHydrationStatus);
  return (
    authHydrationStatus === "hydrating" || authHydrationStatus === "pending"
  );
}

/**
 * Hook to get session restoration error if any.
 *
 * @returns Error message or null
 */
export function useSessionError(): string | null {
  return useAuthSessionStore((s) => s.authError);
}
