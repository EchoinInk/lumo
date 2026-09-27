import { getOnboardingRedirect } from "@/features/onboarding/utils/onboardingRouting";
import { assertEqual } from "../testUtils";

export function testFreshInstallRedirectsToOnboardingAfterHydration(): void {
  assertEqual(getOnboardingRedirect(false, ["(tabs)"]), "/onboarding", "incomplete onboarding should gate product routes");
  assertEqual(getOnboardingRedirect(false, ["onboarding", "planning"]), null, "interrupted onboarding route should remain available");
}

export function testCompletedOnboardingCannotReopenFirstRunFlow(): void {
  assertEqual(getOnboardingRedirect(true, ["onboarding"]), "/(tabs)", "completed onboarding should return to the product");
  assertEqual(getOnboardingRedirect(true, ["(tabs)", "tasks"]), null, "completed onboarding should preserve product navigation");
}
