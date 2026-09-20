/**
 * Root Layout
 * Handles first-run routing for onboarding
 * Wrapped with ErrorBoundary for production hardening
 */

import { GlobalErrorBoundary } from "@/src/components/feedback/GlobalErrorBoundary";
import { recordAuthCallbackUrl } from "@/services/api/auth/authCallbackLink";
import { observability } from "@/src/services/observability";
import { useSessionBootstrap } from "@/features/auth/hooks/useSessionBootstrap";
import * as Linking from "expo-linking";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  // Restore a persisted Supabase session and settle auth route guards.
  useSessionBootstrap();

  // Capture the raw URL before Expo Router consumes it for route selection.
  // `useLinkingURL` is the SDK 55 replacement for the deprecated `useURL`.
  const linkingUrl = Linking.useLinkingURL();
  recordAuthCallbackUrl(linkingUrl);

  useEffect(() => {
    const startupMeasurementId =
      observability.performance.startMeasurement("app.startup_duration");

    SplashScreen.hideAsync();
    observability.performance.endMeasurement(startupMeasurementId);
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <RootLayoutContent />
    </GlobalErrorBoundary>
  );
}
