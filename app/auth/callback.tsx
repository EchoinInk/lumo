import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { establishSessionFromAuthCallback, getAuthCallbackIntent } from "@/services/api/auth/supabaseAuth.session";
import { beginRecoverySession, clearRecoverySession } from "@/services/api/auth/recoverySessionGuard";
import { useAuthSessionStore } from "@/features/auth/store/useAuthSessionStore";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";

export default function AuthCallbackScreen() {
  const [message, setMessage] = useState("Finishing your sign-in…");

  const url = Linking.useURL();

  useEffect(() => {
    void (async () => {
      if (!url) {
        setMessage("This sign-in link is incomplete. Please try again.");
        return;
      }
      clearRecoverySession();
      const result = await establishSessionFromAuthCallback(url);
      if (!result.success || !result.data?.user) {
        setMessage(result.error?.message ?? "We couldn't complete your sign-in. Please try again.");
        return;
      }
      const store = useAuthSessionStore.getState();
      const localOwnerId = store.localOwnerId ?? `local-${Date.now()}`;
      store.setAuthenticatedSession(localOwnerId, result.data.user.id);
      if (getAuthCallbackIntent(url) === "recovery") {
        beginRecoverySession();
        router.replace("/auth/reset-password" as never);
        return;
      }
      router.replace("/(tabs)/more/account" as never);
    })();
  }, [url]);

  return <Screen><Text variant="body">{message}</Text></Screen>;
}
