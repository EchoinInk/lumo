import "@/global.css";
import { useFonts } from "expo-font";
import { brandFonts } from "@/theme/brandFonts";
import { MelloAppearance } from "@/theme/MelloAppearance";
/**
 * Root Layout
 * Handles first-run routing for onboarding
 * Wrapped with ErrorBoundary for production hardening
 */

import { GlobalErrorBoundary } from "@/src/components/feedback/GlobalErrorBoundary";
import { ActiveLocalDataGate } from "@/src/components/feedback/ActiveLocalDataGate";
import { observability } from "@/src/services/observability";
import { useOnboardingStore } from "@/src/features/onboarding/store/useOnboardingStore";
import { getOnboardingRedirect } from "@/src/features/onboarding/utils/onboardingRouting";
import { SplashScreen, Stack, router, useSegments } from "expo-router";
import { useEffect } from "react";
import { ReminderNotificationLifecycle } from "@/src/features/reminders/components/ReminderNotificationLifecycle";

void SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutContent() {
  const [fontsReady, fontError] = useFonts(brandFonts);
  const segments = useSegments();
  const isComplete = useOnboardingStore((state) => state.isComplete);
  const isOnboardingHydrated = useOnboardingStore((state) => state.isHydrated);

  useEffect(() => {
    if (!fontsReady && !fontError) return;
    const startupMeasurementId =
      observability.performance.startMeasurement("app.startup_duration");

    void SplashScreen.hideAsync().catch(() => {});
    observability.performance.endMeasurement(startupMeasurementId);
  }, [fontsReady, fontError]);

  useEffect(() => {
    if ((!fontsReady && !fontError) || !isOnboardingHydrated) return;
    const redirect = getOnboardingRedirect(isComplete, segments);
    if (redirect) router.replace(redirect as any);
  }, [isComplete, isOnboardingHydrated, segments, fontsReady, fontError]);

  if (!fontsReady && !fontError) return null;

  return (
    <ActiveLocalDataGate>
      <ReminderNotificationLifecycle />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </ActiveLocalDataGate>
  );
}

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <MelloAppearance>
        <RootLayoutContent />
      </MelloAppearance>
    </GlobalErrorBoundary>
  );
}
