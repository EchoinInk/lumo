import { useBrainDump } from "@/src/features/brain-dump";
import { useHabits } from "@/src/features/habits";
import { useReminders } from "@/src/features/reminders";
import { useTasks } from "@/src/features/tasks";
import { useLocalDay } from "@/src/hooks/useLocalDay";
import { addLocalDays } from "@/src/utils/dateTime";
import { useCallback, useEffect, useMemo } from "react";
import {
  composeDailyPlanningSummary,
  getBrainDumpReviewQueue,
  getEveningCarryOverItems,
  getGentleCarryOverItems,
  getLowEnergyOptions,
  getSuggestedNextSteps,
} from "../services/planningComposer";
import { usePlanningStore } from "../store/usePlanningStore";
import type {
  PlanningEnergyLevel,
  PlanningFlowMode,
  PlanningNextStep,
  PlanningSourceRef,
  PlanningSourceType,
} from "../types/planning";

const ALL_OPTIONS_LIMIT = Number.MAX_SAFE_INTEGER;

function sameSource(a: PlanningSourceRef, b: PlanningSourceRef): boolean {
  return a.sourceType === b.sourceType && a.sourceId === b.sourceId;
}

function stepRef(step: PlanningNextStep): PlanningSourceRef {
  return { sourceType: step.sourceType, sourceId: step.sourceId };
}

function uniqueWithSelected<T extends PlanningNextStep>(
  options: T[],
  selected?: T,
): T[] {
  if (!selected || options.some((option) => sameSource(option, selected))) {
    return options;
  }
  return [selected, ...options].slice(0, 3);
}

export function useDailyPlanningFlow(mode: PlanningFlowMode = "morning") {
  const today = useLocalDay();
  const { tasks, updateTask, hasHydrated: tasksHydrated } = useTasks();
  const { openEntries, archiveEntry, restoreEntry, hasHydrated: brainDumpHydrated } =
    useBrainDump();
  const { reminders, hasHydrated: remindersHydrated } = useReminders();
  const { pendingToday, isHydrated: habitsHydrated } = useHabits();
  const {
    summary,
    parking,
    hasHydrated: summaryLoaded,
    hydratePlanning,
    updateSummary,
    parkSource,
    unparkSource,
    removeParkedSource,
  } = usePlanningStore();

  useEffect(() => {
    hydratePlanning(today);
  }, [hydratePlanning, today]);

  const energyLevel = summary.energyLevel;
  const routineAnchors = useMemo(
    () => pendingToday.map((habit) => ({ id: habit.id, label: habit.title })),
    [pendingToday],
  );
  const routineLabels = useMemo(
    () => routineAnchors.map((anchor) => anchor.label),
    [routineAnchors],
  );

  const composerInput = useMemo(
    () => ({
      tasks,
      reminders,
      routineLabels,
      routineAnchors,
      brainDumpEntries: openEntries,
      energyLevel,
      today,
    }),
    [tasks, reminders, routineLabels, routineAnchors, openEntries, energyLevel, today],
  );

  const parkedItems = parking.parkedItems;
  const parkedRefs = useMemo(
    () => new Set(parkedItems.map((item) => `${item.sourceType}:${item.sourceId}`)),
    [parkedItems],
  );
  const isParked = useCallback(
    (ref: PlanningSourceRef) => parkedRefs.has(`${ref.sourceType}:${ref.sourceId}`),
    [parkedRefs],
  );

  const carryOverItems = useMemo(
    () => {
      const carriedSourceIds = new Set(
        summary.carryOverIds.map((id) => id.replace(/^carry-/, "")),
      );
      const items =
        mode === "evening"
          ? getEveningCarryOverItems(tasks)
          : getGentleCarryOverItems(tasks);
      return items.filter(
        (item) =>
          !isParked({ sourceType: item.sourceType, sourceId: item.sourceId }) &&
          !carriedSourceIds.has(item.sourceId) &&
          !summary.eveningCarriedIds.includes(item.sourceId),
      );
    },
    [
      tasks,
      mode,
      isParked,
      summary.carryOverIds,
      summary.eveningCarriedIds,
    ],
  );
  const brainDumpQueue = useMemo(
    () => getBrainDumpReviewQueue(openEntries),
    [openEntries],
  );
  const brainDumpBacklogCount = useMemo(
    () => openEntries.filter((entry) => entry.status === "open").length,
    [openEntries],
  );
  const nextStepOptions = useMemo(
    () => {
      return getSuggestedNextSteps(composerInput).filter(
        (step) => !isParked(stepRef(step)),
      );
    },
    [composerInput, isParked],
  );
  const lowEnergyOptions = useMemo(
    () => {
      return getLowEnergyOptions(composerInput).filter(
        (option) =>
          !isParked({ sourceType: option.sourceType, sourceId: option.sourceId }),
      );
    },
    [composerInput, isParked],
  );
  const allNextStepOptions = useMemo(
    () =>
      getSuggestedNextSteps(composerInput, ALL_OPTIONS_LIMIT).filter(
        (step) => !isParked(stepRef(step)),
      ),
    [composerInput, isParked],
  );
  const allLowEnergyOptions = useMemo(
    () =>
      getLowEnergyOptions(composerInput, ALL_OPTIONS_LIMIT).filter(
        (option) =>
          !isParked({ sourceType: option.sourceType, sourceId: option.sourceId }),
      ),
    [composerInput, isParked],
  );
  const carryOverBacklogCount = useMemo(() => {
    const carriedSourceIds = new Set(
      summary.carryOverIds.map((id) => id.replace(/^carry-/, "")),
    );
    const items =
      mode === "evening"
        ? getEveningCarryOverItems(tasks, today, ALL_OPTIONS_LIMIT)
        : getGentleCarryOverItems(tasks, today, ALL_OPTIONS_LIMIT);
    return items.filter(
      (item) =>
        !isParked({ sourceType: item.sourceType, sourceId: item.sourceId }) &&
        !carriedSourceIds.has(item.sourceId) &&
        !summary.eveningCarriedIds.includes(item.sourceId),
    ).length;
  }, [tasks, mode, today, isParked, summary.carryOverIds, summary.eveningCarriedIds]);

  const selectedNextStep = useMemo((): PlanningNextStep | undefined => {
    const allOptions = [...allNextStepOptions, ...allLowEnergyOptions];
    const legacySelected = summary.nextStepId
      ? allOptions.find((option) => option.id === summary.nextStepId)
      : undefined;
    const selectedRef =
      summary.nextStepRef ?? (legacySelected ? stepRef(legacySelected) : undefined);

    if (selectedRef) {
      const fromNext = allNextStepOptions.find((step) =>
        sameSource(stepRef(step), selectedRef),
      );
      if (fromNext) return fromNext;

      const fromLow = allLowEnergyOptions.find((option) =>
        sameSource(
          { sourceType: option.sourceType, sourceId: option.sourceId },
          selectedRef,
        ),
      );
      if (fromLow) {
        return {
          id: fromLow.id,
          label: fromLow.label,
          sourceType: fromLow.sourceType,
          sourceId: fromLow.sourceId,
          effort: fromLow.effort,
          reason: fromLow.reason,
        };
      }
    }

    return undefined;
  }, [
    summary.nextStepId,
    summary.nextStepRef,
    allNextStepOptions,
    allLowEnergyOptions,
  ]);

  const visibleNextStepOptions = useMemo(
    () => uniqueWithSelected(nextStepOptions, selectedNextStep),
    [nextStepOptions, selectedNextStep],
  );
  const visibleLowEnergyOptions = useMemo(
    () => uniqueWithSelected(lowEnergyOptions, selectedNextStep),
    [lowEnergyOptions, selectedNextStep],
  );

  const isHydrated =
    tasksHydrated &&
    brainDumpHydrated &&
    remindersHydrated &&
    habitsHydrated &&
    summaryLoaded;

  const chooseEnergyLevel = useCallback(
    (level: PlanningEnergyLevel) => {
      updateSummary((current) => ({
        ...current,
        energyLevel: level,
        nextStepId: undefined,
        nextStepRef: undefined,
        morningCompleted: false,
      }));
    },
    [updateSummary],
  );

  const chooseNextStep = useCallback(
    (stepId: string) => {
      const step = [...allNextStepOptions, ...allLowEnergyOptions].find(
        (option) => option.id === stepId,
      );
      updateSummary((current) => ({
        ...current,
        nextStepId: step?.id ?? stepId,
        nextStepRef: step ? stepRef(step) : current.nextStepRef,
      }));
    },
    [allNextStepOptions, allLowEnergyOptions, updateSummary],
  );

  const carryOverItem = useCallback(
    (sourceId: string) => {
      updateTask(sourceId, { dueDate: today });
      updateSummary((current) => ({
        ...current,
        carryOverIds: [...new Set([...current.carryOverIds, `carry-${sourceId}`])],
      }));
    },
    [updateTask, updateSummary, today],
  );

  const carryToTomorrow = useCallback(
    (sourceId: string) => {
      updateTask(sourceId, { dueDate: addLocalDays(today, 1) });
      updateSummary((current) => {
        const carriedIds = [...new Set([...current.carryOverIds, `carry-${sourceId}`])];
        const eveningCarriedIds =
          mode === "evening"
            ? [...new Set([...current.eveningCarriedIds, sourceId])]
            : current.eveningCarriedIds;
        return {
          ...current,
          carryOverIds: carriedIds,
          eveningCarriedIds,
        };
      });
    },
    [updateTask, updateSummary, mode, today],
  );

  const parkItem = useCallback(
    async (sourceId: string, sourceType: PlanningSourceType = "task") => {
      const ref = { sourceType, sourceId };
      const parkedSelectedNextStep =
        selectedNextStep && sameSource(stepRef(selectedNextStep), ref);

      if (sourceType === "task") {
        const task = tasks.find((item) => item.id === sourceId);
        parkSource(ref, {
          parkedFrom: mode,
          originalDueDate: task?.dueDate ?? null,
        });
        try {
          await updateTask(sourceId, { dueDate: addLocalDays(today, 7) });
        } catch (error) {
          unparkSource(ref);
          throw error;
        }
      } else if (sourceType === "brainDump") {
        parkSource(ref, { parkedFrom: mode });
        archiveEntry(sourceId);
      } else {
        parkSource(ref, { parkedFrom: mode });
      }

      if (parkedSelectedNextStep) {
        updateSummary((current) => ({
          ...current,
          nextStepId: undefined,
          nextStepRef: undefined,
        }));
      }
    },
    [
      tasks,
      updateTask,
      archiveEntry,
      mode,
      selectedNextStep,
      parkSource,
      unparkSource,
      updateSummary,
      today,
    ],
  );

  const bringBackParkedItem = useCallback(
    async (sourceId: string, sourceType: PlanningSourceType = "task") => {
      const item = parkedItems.find(
        (parked) =>
          parked.sourceId === sourceId && parked.sourceType === sourceType,
      );
      if (item?.sourceType === "task") {
        await updateTask(sourceId, {
          dueDate:
            item.originalDueDate === null ? undefined : item.originalDueDate ?? today,
        });
      } else if (item?.sourceType === "brainDump") {
        restoreEntry(sourceId);
      }
      if (item) {
        unparkSource({ sourceType: item.sourceType, sourceId: item.sourceId });
        return;
      }
      unparkSource({ sourceType, sourceId });
    },
    [parkedItems, updateTask, today, restoreEntry, unparkSource],
  );

  const removeParkedItem = useCallback(
    (sourceId: string, sourceType: PlanningSourceType = "task") => {
      const item = parkedItems.find(
        (parked) =>
          parked.sourceId === sourceId && parked.sourceType === sourceType,
      );
      removeParkedSource(
        item
          ? { sourceType: item.sourceType, sourceId: item.sourceId }
          : { sourceType, sourceId },
      );
    },
    [parkedItems, removeParkedSource],
  );

  const markEveningBrainDumpVisited = useCallback(() => {
    updateSummary((current) => ({ ...current, eveningBrainDumpVisited: true }));
  }, [updateSummary]);

  const resetMorningPlan = useCallback(() => {
    updateSummary((current) => ({ ...current, morningCompleted: false }));
  }, [updateSummary]);

  const resetEveningReset = useCallback(() => {
    updateSummary((current) => ({ ...current, eveningCompleted: false }));
  }, [updateSummary]);

  const completeMorningPlan = useCallback(() => {
    const next = composeDailyPlanningSummary(composerInput, {
      ...summary,
      morningCompleted: true,
    });
    updateSummary(() => next);
  }, [composerInput, summary, updateSummary]);

  const completeEveningReset = useCallback(() => {
    updateSummary((current) => ({ ...current, eveningCompleted: true }));
  }, [updateSummary]);

  const morningComplete = summary.morningCompleted;
  const showEveningReset =
    mode === "evening" ||
    (summary.morningCompleted && !summary.eveningCompleted) ||
    (new Date().getHours() >= 18 && !summary.eveningCompleted);

  return {
    mode,
    energyLevel,
    summary,
    parkedItems,
    eveningParkedItems: parkedItems.filter((item) => item.parkedFrom === "evening"),
    carryOverItems,
    brainDumpQueue,
    brainDumpBacklogCount,
    carryOverBacklogCount,
    nextStepOptions: visibleNextStepOptions,
    lowEnergyOptions: visibleLowEnergyOptions,
    selectedNextStep,
    morningComplete,
    showEveningReset,
    isHydrated,
    chooseEnergyLevel,
    chooseNextStep,
    carryOverItem,
    carryToTomorrow,
    parkItem,
    bringBackParkedItem,
    removeParkedItem,
    markEveningBrainDumpVisited,
    resetMorningPlan,
    resetEveningReset,
    completeMorningPlan,
    completeEveningReset,
  };
}
