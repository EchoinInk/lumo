import { EmptyState } from "@/src/components/ui/EmptyState";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { ScreenBackButton } from "@/src/components/ui/ScreenBackButton";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Text } from "@/src/components/ui/Text";
import {
  createRoutineBundleApplyGuard,
  createTasksFromBundle,
  routineBundleTaskOperationId,
  starterRoutineBundles,
} from "@/src/features/routines";
import { useTasks } from "@/src/features/tasks";
import { Colors, Spacing } from "@/src/theme/tokens";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { RoutineBundleCard } from "../components/RoutineBundleCard";

export default function RoutineBundlesScreen() {
  const { createTask, mutationError, tasks } = useTasks();
  const applyGuard = useRef(createRoutineBundleApplyGuard()).current;
  const releaseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [applyingBundleIds, setApplyingBundleIds] = useState<string[]>([]);
  const [appliedBundleIds, setAppliedBundleIds] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      releaseTimers.current.forEach(clearTimeout);
    };
  }, []);

  const handleUseBundle = async (bundle: typeof starterRoutineBundles[0]) => {
    if (!applyGuard.begin(bundle.id)) return;

    setApplyingBundleIds((current) =>
      current.includes(bundle.id) ? current : [...current, bundle.id],
    );

    try {
      const tasks = createTasksFromBundle(bundle);
      for (const task of tasks) {
        await createTask(task);
      }
      setAppliedBundleIds((current) =>
        current.includes(bundle.id) ? current : [...current, bundle.id],
      );
      releaseTimers.current.push(
        setTimeout(() => {
          applyGuard.release(bundle.id);
          setApplyingBundleIds((current) =>
            current.filter((bundleId) => bundleId !== bundle.id),
          );
          setAppliedBundleIds((current) =>
            current.filter((bundleId) => bundleId !== bundle.id),
          );
        }, 1200),
      );
    } catch {
      applyGuard.release(bundle.id);
      setApplyingBundleIds((current) =>
        current.filter((bundleId) => bundleId !== bundle.id),
      );
    }
  };

  return (
    <Screen scrollable padded>
      <ScreenBackButton fallbackPath="/(tabs)/tasks" />
      <SectionHeader
        title="Routine Bundles"
        subtitle="Start from small repeatable templates."
      />

      {mutationError && (
        <Card variant="outlined" style={styles.errorCard}>
          <Text variant="small" color={Colors.danger} accessibilityRole="alert">
            {mutationError}
          </Text>
        </Card>
      )}

      <View style={styles.list}>
        {starterRoutineBundles.length === 0 ? (
          <EmptyState
            title="No bundles yet"
            description="Routine bundles will appear here when available."
          />
        ) : (
          starterRoutineBundles.map((bundle) => (
            <RoutineBundleCard
              key={bundle.id}
              bundle={bundle}
              onUse={handleUseBundle}
              isApplying={applyingBundleIds.includes(bundle.id)}
              isApplied={
                appliedBundleIds.includes(bundle.id) ||
                bundle.items.every((_, index) =>
                  tasks.some(
                    (task) =>
                      task.sourceOperationId ===
                      routineBundleTaskOperationId(bundle.id, index),
                  ),
                )
              }
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.dangerSoft,
    borderColor: Colors.danger + "30",
  },
  list: {
    gap: Spacing.md,
  },
});
