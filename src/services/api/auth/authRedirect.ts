import * as Linking from "expo-linking";

export const AUTH_CALLBACK_PATH = "auth/callback";

/**
 * Canonical mobile return URL for Supabase email confirmation and recovery.
 * With Lumo's configured Expo scheme this resolves to
 * `lumomobile://auth/callback` in a development build.
 */
export function getAuthRedirectUrl(): string {
  return Linking.createURL(AUTH_CALLBACK_PATH);
}
