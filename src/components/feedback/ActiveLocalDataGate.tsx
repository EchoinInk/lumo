import { useBrainDumpStore } from "@/src/features/brain-dump/store/useBrainDumpStore";
import { useHabitStore } from "@/src/features/habits/store/useHabitStore";
import { useCleaningStore } from "@/src/features/cleaning/store/useCleaningStore";
import { useMealStore } from "@/src/features/meals/store/useMealStore";
import { useBudgetCategoryStore } from "@/src/features/budget/store/useBudgetCategoryStore";
import { useBudgetTransactionStore } from "@/src/features/budget/store/useBudgetTransactionStore";
import { usePaymentStore } from "@/src/features/payments/store/usePaymentStore";
import { useOnboardingStore } from "@/src/features/onboarding/store/useOnboardingStore";
import { loadPlanningState } from "@/src/features/planning/services/planningStorage";
import { useReminderStore } from "@/src/features/reminders/store/useReminderStore";
import { useTaskStore } from "@/src/features/tasks/store/useTaskStore";
import { activeStorageDefinitions } from "@/src/services/storage/domainSchemas";
import {
  PersistenceLoadError,
  recoverDomainWithEmptyData,
  type PersistenceDomain,
  type VersionedStorageDefinition,
} from "@/src/services/storage/versionedStorage";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Colors } from "@/src/theme/tokens";
import { RecoverySheet } from "./RecoverySheet";

interface Props {
  children: React.ReactNode;
}

const domainLabels: Record<PersistenceDomain, string> = {
  tasks: "tasks",
  habits: "habits",
  cleaning: "cleaning schedule",
  meals: "consumed meals",
  recipes: "recipes",
  groceries: "groceries",
  "meal-plans": "meal plans",
  "budget-categories": "budget categories",
  "budget-transactions": "income and expenses",
  payments: "payments",
  settings: "settings",
  onboarding: "onboarding preferences",
  "brain-dump": "brain dump",
  reminders: "reminders",
  "reminder-settings": "reminder settings",
  planning: "daily plan",
  "planning-parking": "parked planning items",
};

function messageFor(error: PersistenceLoadError): string {
  const label = domainLabels[error.domain];
  switch (error.kind) {
    case "unsupported-schema-version":
      return `Your ${label} data was created by an unsupported version of Lumo. It has not been changed.`;
    case "migration-failure":
      return `Lumo could not safely finish updating your ${label} data. The original data remains preserved.`;
    case "unreadable-data":
      return `Lumo cannot read your ${label} data right now. It has not attempted to replace it.`;
    default:
      return `Your ${label} data is not in a form Lumo can safely use. The stored data remains untouched.`;
  }
}

export function ActiveLocalDataGate({ children }: Props): React.JSX.Element {
  const [attempt, setAttempt] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [issues, setIssues] = useState<PersistenceLoadError[]>([]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const operations: {
      domain: PersistenceDomain;
      run: () => void | Promise<void>;
    }[] = [
      { domain: "tasks", run: () => useTaskStore.getState().hydrateTasks() },
      { domain: "habits", run: () => useHabitStore.getState().hydrate() },
      { domain: "cleaning", run: () => useCleaningStore.getState().hydrate() },
      { domain: "meals", run: () => useMealStore.getState().hydrate() },
      { domain: "budget-categories", run: () => useBudgetCategoryStore.getState().hydrate() },
      { domain: "budget-transactions", run: () => useBudgetTransactionStore.getState().hydrate() },
      { domain: "payments", run: () => usePaymentStore.getState().hydrate() },
      { domain: "settings", run: () => useSettingsStore.getState().hydrateSettings() },
      { domain: "onboarding", run: () => useOnboardingStore.getState().hydrate() },
      { domain: "brain-dump", run: () => useBrainDumpStore.getState().hydrate() },
      { domain: "reminders", run: () => useReminderStore.getState().hydrate() },
      { domain: "planning", run: () => { loadPlanningState(); } },
    ];

    Promise.all(
      operations.map(async ({ domain, run }) => {
        try {
          await run();
          return null;
        } catch (error) {
          if (error instanceof PersistenceLoadError) return error;
          return new PersistenceLoadError(
            domain,
            "unreadable-data",
            `Stored ${domain} data could not be loaded.`,
            undefined,
            error,
          );
        }
      }),
    ).then((results) => {
      if (!active) return;
      setIssues(results.filter((issue): issue is PersistenceLoadError => issue !== null));
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [attempt]);

  if (isLoading) {
    return (
      <View style={styles.loading} accessibilityLabel="Loading your local data">
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const issue = issues[0];
  if (issue) {
    const actions: React.ComponentProps<typeof RecoverySheet>["actions"] = [
      { label: "Try again", onPress: () => setAttempt((value) => value + 1) },
    ];
    if (issue.kind !== "unreadable-data") {
      actions.push({
        label: `Archive and reset ${domainLabels[issue.domain]}`,
        variant: "danger",
        onPress: () => {
          const definition = activeStorageDefinitions[issue.domain] as VersionedStorageDefinition<unknown>;
          recoverDomainWithEmptyData(definition);
          setAttempt((value) => value + 1);
        },
      });
    }

    return (
      <RecoverySheet
        title="Your local data needs attention"
        message={`${messageFor(issue)} You can try again without changing anything, or explicitly archive and reset only this area.`}
        actions={actions}
      />
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
});
