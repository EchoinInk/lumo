import fs from "fs";
import path from "path";
import { CanonicalLocalDomains } from "@/services/storage/canonicalOwnership";
import { assertEqual } from "../testUtils";

const rootDir = path.resolve(__dirname, "../../..");

export function testCanonicalOwnershipRegistryNamesAllRequiredDomains(): void {
  assertEqual(
    Object.keys(CanonicalLocalDomains).sort().join(","),
    "habits,onboarding,settings,tasks",
    "WP2.1 should inventory exactly the four required local domains",
  );
}

export function testObsoleteTaskAndHabitStoresAreCompatibilityAliases(): void {
  for (const [legacyPath, canonicalPath] of [
    ["src/store/useTaskStore.ts", "@/features/tasks/store/useTaskStore"],
    ["src/store/useHabitStore.ts", "@/features/habits/store/useHabitStore"],
    ["src/store/useOnboardingStore.ts", "@/features/onboarding/store/useOnboardingStore"],
  ]) {
    const source = fs.readFileSync(path.join(rootDir, legacyPath), "utf8");
    assertEqual(
      source.includes(`export { use${legacyPath.includes("Task") ? "Task" : legacyPath.includes("Habit") ? "Habit" : "Onboarding"}Store } from "${canonicalPath}"`),
      true,
      `${legacyPath} should alias its canonical feature store`,
    );
    assertEqual(
      source.includes("persist("),
      false,
      `${legacyPath} must not activate independent persistence`,
    );
  }
}

export function testLegacyRepositoriesDelegateToFeatureRepositories(): void {
  const taskRepository = fs.readFileSync(
    path.join(rootDir, "src/services/taskRepository.ts"),
    "utf8",
  );
  const habitRepository = fs.readFileSync(
    path.join(rootDir, "src/services/habitRepository.ts"),
    "utf8",
  );

  assertEqual(
    taskRepository.includes("taskLocalRepository"),
    true,
    "legacy task repository should delegate to the canonical repository",
  );
  assertEqual(
    habitRepository.includes("habitLocalRepository"),
    true,
    "legacy habit repository should delegate to the canonical repository",
  );
}
