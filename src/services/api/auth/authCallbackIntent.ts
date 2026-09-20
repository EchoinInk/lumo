export type AuthCallbackIntent = "recovery" | "confirmation";

export type AuthCallbackCredentialType = "pkce" | "implicit" | "missing";

type AuthCallbackParameters = {
  code: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  errorMessage: string | null;
  type: string | null;
};

/**
 * Reads callback parameters from both the query string and fragment.
 *
 * Supabase can use either PKCE (`?code=…`) or implicit (`#access_token=…`)
 * redirects. A recovery redirect may also put its type in a different URL
 * component from its credentials, so neither component can be ignored.
 * Credentials remain inside the auth service and are never logged.
 */
export function getAuthCallbackParameters(url: string): AuthCallbackParameters {
  try {
    const parsed = new URL(url);
    const query = new URLSearchParams(parsed.search);
    const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ""));
    const get = (name: string) => fragment.get(name) ?? query.get(name);

    return {
      code: get("code"),
      accessToken: get("access_token"),
      refreshToken: get("refresh_token"),
      errorMessage: get("error_description") ?? get("error"),
      type: get("type"),
    };
  } catch {
    return {
      code: null,
      accessToken: null,
      refreshToken: null,
      errorMessage: "This sign-in link is invalid. Please request a new one.",
      type: null,
    };
  }
}

export function getAuthCallbackCredentialType(url: string): AuthCallbackCredentialType {
  const params = getAuthCallbackParameters(url);
  if (params.code) return "pkce";
  if (params.accessToken && params.refreshToken) return "implicit";
  return "missing";
}

/** Reads only the callback type; credentials are intentionally never returned. */
export function getAuthCallbackIntent(
  url: string,
  authEvent?: string | null,
): AuthCallbackIntent {
  // With PKCE Supabase signals recovery through PASSWORD_RECOVERY instead of
  // guaranteeing `type=recovery` remains in the redirect URL.
  return authEvent === "PASSWORD_RECOVERY" || getAuthCallbackParameters(url).type === "recovery"
    ? "recovery"
    : "confirmation";
}
