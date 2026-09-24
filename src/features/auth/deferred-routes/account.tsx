import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { AuthGuard } from "@/features/auth/components/AuthGuard";
import { useGuestMigrationStatus } from "@/features/auth/hooks/useGuestMigrationStatus";
import {
    beginLogoutTransition,
    finalizeLogoutTransition,
} from "@/features/auth/services/authTransitionOrchestrator";
import { useAuthSessionStore } from "@/features/auth/store/useAuthSessionStore";
import { getAccountEmailDisplay } from "@/features/auth/utils/accountEmailDisplay";
import { signOutSession } from "@/services/api/auth/supabaseAuth.session";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

// Dev-only imports
if (__DEV__) {
  require("@/features/auth/testing/migrationSafetyHarness");
}

function AccountContent() {
  const authUser = useAuthSessionStore((s) => s.authUser);
  const cloudOwnerId = useAuthSessionStore((s) => s.cloudOwnerId);
  const localOwnerId = useAuthSessionStore((s) => s.localOwnerId);
  const accountMode = useAuthSessionStore((s) => s.accountMode);
  const signOut = useAuthSessionStore((s) => s.signOut);
  const migrationStatus = useGuestMigrationStatus();
  const [harnessResult, setHarnessResult] = useState<string | null>(null);
  const [isRunningHarness, setIsRunningHarness] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const [isRunningCleanup, setIsRunningCleanup] = useState(false);

  const handleLogout = async () => {
    try {
      // Begin logout transition
      beginLogoutTransition(cloudOwnerId || "guest", cloudOwnerId || "guest");

      // Sign out from Supabase
      await signOutSession();

      // Sign out from session store
      await signOut();

      // Finalize logout transition
      finalizeLogoutTransition();

      // Navigate back to More screen
      router.back();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleRunHarness = async () => {
    if (!__DEV__) return;
    setIsRunningHarness(true);
    setHarnessResult(null);

    try {
      const {
        runMigrationSafetyHarness,
      } = require("@/features/auth/testing/migrationSafetyHarness");
      const result = await runMigrationSafetyHarness();
      setHarnessResult(result.summary);
    } catch (err) {
      setHarnessResult(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsRunningHarness(false);
    }
  };

  const handleResetHarness = () => {
    if (!__DEV__) return;
    const {
      clearMockMigrationTestData,
      resetMigrationSafetyHarness,
    } = require("@/features/auth/testing/migrationSafetyHarness");
    clearMockMigrationTestData();
    resetMigrationSafetyHarness();
    setHarnessResult("Test data cleared");
  };

  const handleRunCleanup = async () => {
    if (!__DEV__) return;
    setIsRunningCleanup(true);
    setCleanupResult(null);

    try {
      const {
        runControlledGuestCleanup,
        TEST_GUEST_OWNER_ID,
      } = require("@/features/auth/services/migrationCleanup");
      const result = await runControlledGuestCleanup(
        TEST_GUEST_OWNER_ID,
        "CONFIRM_GUEST_CLEANUP",
      );
      setCleanupResult(
        `Cleanup ${result.success ? "completed" : "failed"}: ${result.deletedKeyCount} keys deleted, ${result.failedKeyCount} failed`,
      );
    } catch (err) {
      setCleanupResult(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsRunningCleanup(false);
    }
  };

  return (
    <Screen scrollable>
      <View className="py-8">
        <Text variant="heading" className="mb-2">
          Account
        </Text>
        <Text variant="body" color="textSecondary" className="mb-8">
          Manage your account settings
        </Text>

        <View className="bg-card rounded-lg p-4 mb-4">
          <Text variant="subheading" className="mb-2">
            Signed in as
          </Text>
          <Text variant="body" className="mb-1">
            {getAccountEmailDisplay(authUser)}
          </Text>
          <Text variant="small" color="textTertiary">
            Account ID: {cloudOwnerId?.slice(0, 8)}...
          </Text>
        </View>

        {/* Debug-only migration diagnostics */}
        {__DEV__ && (
          <View className="bg-card rounded-lg p-4 mb-4 border border-border">
            <Text variant="subheading" className="mb-2">
              Migration Diagnostics (Dev Only)
            </Text>
            <Text variant="small" color="textTertiary" className="mb-1">
              Account Mode: {accountMode}
            </Text>
            <Text variant="small" color="textTertiary" className="mb-1">
              Local Owner ID: {localOwnerId?.slice(0, 8)}...
            </Text>
            <Text variant="small" color="textTertiary" className="mb-1">
              Cloud Owner ID: {cloudOwnerId?.slice(0, 8)}...
            </Text>
            <Text variant="small" color="textTertiary" className="mb-1">
              Migration Status: {migrationStatus.status}
            </Text>
            <Text variant="small" color="textTertiary" className="mb-1">
              Rollback Available:{" "}
              {migrationStatus.rollbackAvailable ? "Yes" : "No"}
            </Text>
            <Text variant="small" color="textTertiary" className="mb-1">
              Cleanup Eligible: {migrationStatus.cleanupEligible ? "Yes" : "No"}
            </Text>
            {migrationStatus.latestReport && (
              <Text variant="small" color="textTertiary" className="mb-1">
                Last Validation: {migrationStatus.latestReport.status}
              </Text>
            )}
            <View className="mt-4 border-t border-border pt-4">
              <Text variant="subheading" className="mb-2">
                Migration Test Harness
              </Text>
              <Button
                onPress={handleRunHarness}
                disabled={isRunningHarness}
                className="mb-2"
              >
                {isRunningHarness ? "Running..." : "Run migration safety test"}
              </Button>
              <Button
                variant="ghost"
                onPress={handleResetHarness}
                className="mb-2"
              >
                Reset migration test data
              </Button>
              {harnessResult && (
                <Text variant="small" color="textTertiary" className="mt-2">
                  {harnessResult}
                </Text>
              )}
            </View>
            <View className="mt-4 border-t border-border pt-4">
              <Text variant="subheading" className="mb-2">
                Controlled Cleanup (Dev Only)
              </Text>
              <Button
                onPress={handleRunCleanup}
                disabled={isRunningCleanup}
                className="mb-2"
              >
                {isRunningCleanup
                  ? "Running..."
                  : "Run controlled cleanup test"}
              </Button>
              {cleanupResult && (
                <Text variant="small" color="textTertiary" className="mt-2">
                  {cleanupResult}
                </Text>
              )}
            </View>
          </View>
        )}

        <Button variant="danger" onPress={handleLogout} className="mb-4">
          Sign out
        </Button>

        <Button variant="ghost" onPress={() => router.back()}>
          Back
        </Button>
      </View>
    </Screen>
  );
}

export default function AccountScreen() {
  const accountMode = useAuthSessionStore((s) => s.accountMode);

  // If in guest mode, show guest fallback
  if (accountMode === "guest") {
    return (
      <Screen scrollable>
        <View className="flex-1 justify-center py-12">
          <Text variant="heading" className="mb-2 text-center">
            You're using Lumo as a guest
          </Text>
          <Text
            variant="body"
            color="textSecondary"
            className="mb-8 text-center"
          >
            Sign in or create an account to access your account settings
          </Text>
          <Button
            onPress={() => router.push("/auth/login" as any)}
            className="mb-4"
          >
            Sign in
          </Button>
          <Button
            variant="ghost"
            onPress={() => router.push("/auth/signup" as any)}
            className="mb-4"
          >
            Create an account
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            Back
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <AuthGuard
      mode="requireAuthenticated"
      fallback={
        <Screen scrollable>
          <View className="flex-1 justify-center py-12">
            <Text variant="heading" className="mb-2 text-center">
              Sign in required
            </Text>
            <Text
              variant="body"
              color="textSecondary"
              className="mb-8 text-center"
            >
              You need to be signed in to view your account
            </Text>
            <Button
              onPress={() => router.push("/auth/login" as any)}
              className="mb-4"
            >
              Sign in
            </Button>
            <Button
              variant="ghost"
              onPress={() => router.push("/auth/signup" as any)}
              className="mb-4"
            >
              Create an account
            </Button>
            <Button variant="ghost" onPress={() => router.back()}>
              Back
            </Button>
          </View>
        </Screen>
      }
    >
      <AccountContent />
    </AuthGuard>
  );
}
