import { useOnboardingStore } from "@/features/onboarding/store/useOnboardingStore";
import { setString } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { createPersistStorage } from "@/store/createPersistStorage";
import { assertDeepEqual, assertEqual, resetTestState } from "../testUtils";
import { PersistenceLoadError } from "@/services/storage/versionedStorage";

export async function testPersistStorageHandlesMissingState(): Promise<void> {
  resetTestState();
  const storage = createPersistStorage();

  const value = await storage.getItem("missing-key");

  assertEqual(value, null, "missing persisted state should return null");
}

export async function testPersistStorageRoundTripAndRemoval(): Promise<void> {
  resetTestState();
  const storage = createPersistStorage();

  await storage.setItem("hydration-key", "value");
  assertEqual(
    await storage.getItem("hydration-key"),
    "value",
    "persist storage should read written values",
  );

  await storage.removeItem("hydration-key");
  assertEqual(
    await storage.getItem("hydration-key"),
    null,
    "persist storage should remove values",
  );
}

export async function testOnboardingHydrationSettlesIntoRecoveryOnCorruption(): Promise<void> {
  resetTestState();
  useOnboardingStore.getState().resetOnboarding();
  setString(StorageKeys.ONBOARDING, "{not json");

  const originalError = console.error;
  console.error = () => undefined;
  try {
    try {
      await useOnboardingStore.getState().hydrate();
      throw new Error("corrupt onboarding data should reject hydration");
    } catch (error) {
      assertEqual(
        error instanceof PersistenceLoadError && error.kind,
        "malformed-data",
        "corrupt onboarding should produce an actionable persistence error",
      );
    }
  } finally {
    console.error = originalError;
  }

  const state = useOnboardingStore.getState();

  assertEqual(state.isHydrated, true, "corrupted hydration should still complete");
  assertEqual(
    state.hydrationError !== null,
    true,
    "corrupted hydration should expose recovery state",
  );
  assertEqual(state.isComplete, false, "corrupted hydration should fail closed");
  assertDeepEqual(
    state.preferences,
    {
      struggleAreas: [],
      planningStyle: null,
      focusAreas: [],
    },
    "corrupted hydration should keep default preferences",
  );
}

export async function testOnboardingHydrationRestoresPersistedState(): Promise<void> {
  resetTestState();
  setString(
    StorageKeys.ONBOARDING,
    JSON.stringify({
      isComplete: true,
      preferences: {
        struggleAreas: ["feeling_overwhelmed"],
        planningStyle: "minimal",
        focusAreas: ["tasks"],
      },
      completedAt: "2026-01-01T00:00:00.000Z",
    }),
  );

  await useOnboardingStore.getState().hydrate();
  const state = useOnboardingStore.getState();

  assertEqual(state.isComplete, true, "hydration should restore completion");
  assertEqual(
    state.completedAt,
    "2026-01-01T00:00:00.000Z",
    "hydration should restore completedAt",
  );
}
