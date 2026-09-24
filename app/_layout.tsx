/**
 * Root Layout
 * Handles first-run routing for onboarding
 * Wrapped with ErrorBoundary for production hardening
 */

import { GlobalErrorBoundary } from "@/src/components/feedback/GlobalErrorBoundary";
import { observability } from "@/src/services/observability";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
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
