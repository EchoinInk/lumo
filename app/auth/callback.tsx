import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { establishSessionFromAuthCallback } from "@/services/api/auth/supabaseAuth.session";
import { mapSupabaseSessionToAuthUser } from "@/services/api/auth/supabaseAuth.mapper";
import {
  clearRecordedAuthCallbackUrl,
  recordAuthCallbackDiagnostic,
  resolveAuthCallbackUrl,
} from "@/services/api/auth/authCallbackLink";
import { beginRecoverySession, clearRecoverySession } from "@/services/api/auth/recoverySessionGuard";
import { useAuthSessionStore } from "@/features/auth/store/useAuthSessionStore";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";

export default function AuthCallbackScreen() {
  const [message, setMessage] = useState("Finishing your sign-in…");
  const processedUrl = useRef<string | null>(null);

  const observedUrl = Linking.useLinkingURL();

  useEffect(() => {
    void (async () => {
      // Expo Router may have already consumed a warm-link event to select this
      // route. Native Linking still provides the launch URL for cold starts.
      const initialUrl = await Linking.getInitialURL();
      const url = resolveAuthCallbackUrl(observedUrl, initialUrl);
      if (!url) {
        recordAuthCallbackDiagnostic("missing_url", null);
        setMessage("This sign-in link is incomplete. Please try again.");
        return;
      }
      if (processedUrl.current === url) return;
      processedUrl.current = url;

      recordAuthCallbackDiagnostic("received", url);
      clearRecoverySession();
      const result = await establishSessionFromAuthCallback(url);
      if (!result.success || !result.data?.user) {
        clearRecordedAuthCallbackUrl(url);
        recordAuthCallbackDiagnostic("session_failed", url, result.error?.type);
        setMessage(result.error?.message ?? "We couldn't complete your sign-in. Please try again.");
        return;
      }
      recordAuthCallbackDiagnostic("session_established", url);
      clearRecordedAuthCallbackUrl(url);
      const store = useAuthSessionStore.getState();
      const localOwnerId = store.localOwnerId ?? `local-${Date.now()}`;
      const authUser = mapSupabaseSessionToAuthUser(result.data, localOwnerId);
      if (!authUser) {
        setMessage("We couldn't load your account details. Please try again.");
        return;
      }
      store.setAuthenticatedSession(localOwnerId, result.data.user.id, authUser);
      if (result.data.callbackIntent === "recovery") {
        beginRecoverySession();
        router.replace("/auth/reset-password" as never);
        return;
      }
      router.replace("/(tabs)/more/account" as never);
    })();
  }, [observedUrl]);

  return <Screen><Text variant="body">{message}</Text></Screen>;
}
