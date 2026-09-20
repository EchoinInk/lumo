import {
  getAuthCallbackCredentialType,
  getAuthCallbackParameters,
} from "./authCallbackIntent";

/**
 * In-memory hand-off for a deep link that Expo Router has already consumed
 * while navigating to the callback route. It is deliberately never persisted.
 */
let latestAuthCallbackUrl: string | null = null;

function isAuthCallbackUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "lumomobile:" &&
      ((parsed.hostname === "auth" && parsed.pathname === "/callback") ||
        (parsed.hostname === "" && parsed.pathname === "/auth/callback"))
    );
  } catch {
    return false;
  }
}

export function recordAuthCallbackUrl(url: string | null): void {
  if (url && isAuthCallbackUrl(url)) latestAuthCallbackUrl = url;
}

export function getRecordedAuthCallbackUrl(): string | null {
  return latestAuthCallbackUrl;
}

export function clearRecordedAuthCallbackUrl(url?: string): void {
  if (!url || latestAuthCallbackUrl === url) latestAuthCallbackUrl = null;
}

/** Picks the raw native URL in preference to route-derived state. */
export function resolveAuthCallbackUrl(
  observedUrl: string | null,
  initialUrl: string | null,
): string | null {
  return observedUrl ?? initialUrl ?? getRecordedAuthCallbackUrl();
}

/**
 * Development-only diagnostics. This deliberately records only stage and
 * parameter presence—not the URL, its credentials, or any Supabase message.
 */
export function recordAuthCallbackDiagnostic(
  stage: "received" | "missing_url" | "session_established" | "session_failed",
  url: string | null,
  errorCategory?: string,
): void {
  if (typeof __DEV__ === "undefined" || !__DEV__) return;

  const params = url ? getAuthCallbackParameters(url) : null;
  console.info("[AuthCallback]", {
    stage,
    credentialType: url ? getAuthCallbackCredentialType(url) : "missing",
    hasCode: Boolean(params?.code),
    hasAccessToken: Boolean(params?.accessToken),
    hasRefreshToken: Boolean(params?.refreshToken),
    hasCallbackError: Boolean(params?.errorMessage),
    errorCategory: errorCategory ?? null,
  });
}
