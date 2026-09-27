export function getOnboardingRedirect(
  isComplete: boolean,
  segments: readonly string[],
): "/onboarding" | "/(tabs)" | null {
  const isOnboardingRoute = segments[0] === "onboarding";
  if (!isComplete && !isOnboardingRoute) return "/onboarding";
  if (isComplete && isOnboardingRoute) return "/(tabs)";
  return null;
}
