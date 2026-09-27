import { QuickCaptureSheet } from "@/src/components/capture/QuickCaptureSheet";
import { Screen } from "@/src/components/ui/Screen";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { DailyProgressCard } from "@/src/features/dashboard/components/DailyProgressCard";
import { FocusSuggestionList } from "@/src/features/dashboard/components/FocusSuggestionList";
import { calculateDailyProgress } from "@/src/features/dashboard/utils/dashboardProgress";
import { getFocusSuggestions } from "@/src/features/dashboard/utils/focusSuggestions";
import { FocusModeBanner } from "@/src/features/focus/components/FocusModeBanner";
import { useFocusMode } from "@/src/features/focus/hooks/useFocusMode";
import { useHabits } from "@/src/features/habits";
import {
  CalmDailySummary,
  useDailyPlanningFlow,
} from "@/src/features/planning";
import { useTasks } from "@/src/features/tasks";
import { useLocalDay } from "@/src/hooks/useLocalDay";
import { addLocalDays } from "@/src/utils/dateTime";
import { router } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

// Quick Actions Component
import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import { Colors, Radius, Spacing } from "@/src/theme/tokens";
import { Brain, Calendar, Cloud, Menu } from "lucide-react-native";
import { useState } from "react";

function QuickActions({ onQuickCapture }: { onQuickCapture: () => void }) {
  const actions = [
    {
      label: "Quick Capture",
      icon: Cloud,
      color: Colors.primary,
      onPress: onQuickCapture,
    },
    {
      label: "Brain Dump",
      icon: Brain,
      color: Colors.purple,
      onPress: () => router.push({ pathname: "/brain-dump" as const } as any),
    },
    {
      label: "Calendar",
      icon: Calendar,
      color: Colors.pink,
      onPress: () =>
        router.push({ pathname: "/(tabs)/calendar" as const } as any),
    },
    {
      label: "More",
      icon: Menu,
      color: Colors.success,
      onPress: () => router.push({ pathname: "/(tabs)/more" as const } as any),
    },
  ];

  return (
    <View style={styles.quickActionsGrid}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.label}
          onPress={action.onPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Card
            variant="elevated"
            style={[styles.quickActionCard, { borderColor: action.color }]}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: action.color + "15" },
              ]}
            >
              <action.icon size={18} color={action.color} />
            </View>
            <Text variant="body" style={styles.actionLabel}>
              {action.label}
            </Text>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function DashboardScreen() {
  const [isQuickCaptureVisible, setIsQuickCaptureVisible] = useState(false);
  const {
    isFocusModeEnabled,
    disableFocusMode,
    enableFocusMode,
    setActiveFocusTask,
  } = useFocusMode();
  const planning = useDailyPlanningFlow("morning");

  // Get real data from Tasks and Habits
  const {
    tasks,
    completedCount: completedTasks,
    toggleTask,
    updateTask,
    hasHydrated: tasksHydrated,
  } = useTasks();
  const { todayHabits, completedToday: completedHabits } = useHabits();
  const today = useLocalDay();

  // Calculate daily progress combining tasks and habits
  const totalTasks = tasks.length;
  const totalHabits = todayHabits.length;
  const completedTaskCount = completedTasks;
  const completedHabitIds = completedHabits.map((h) => h.id);

  const {
    completionRate,
    supportiveLabel,
    totalTodayItems,
    completedTodayItems,
  } = calculateDailyProgress(
    totalTasks,
    completedTaskCount,
    totalHabits,
    completedHabitIds.length,
  );

  const focusSuggestions = tasksHydrated
    ? getFocusSuggestions(tasks, 3, today)
    : [];

  const shiftTaskDate = (taskId: string, days: number) => {
    const target = addLocalDays(today, days);
    updateTask(taskId, { dueDate: target });
  };

  const handleStartTask = (taskId: string) => {
    setActiveFocusTask(taskId);
    enableFocusMode(taskId);
  };

  return (
    <Screen scrollable padded>
      {isFocusModeEnabled && <FocusModeBanner onExit={disableFocusMode} />}

      {/* Greeting Header */}
      <SectionHeader title="Good morning, Alex" subtitle="You've got this" />

      <CalmDailySummary
        nextStep={planning.selectedNextStep}
        energyLevel={planning.energyLevel}
        carryOverCount={planning.carryOverBacklogCount}
        brainDumpCount={planning.brainDumpBacklogCount}
        morningComplete={planning.morningComplete}
        eveningCompleted={planning.summary.eveningCompleted}
        showEveningReset={planning.showEveningReset}
        onOpenPlanning={() =>
          router.push({ pathname: "/planning/morning" as const } as any)
        }
        onEveningReset={() =>
          router.push({ pathname: "/planning/evening" as const } as any)
        }
        onAdjustPlan={() => {
          planning.resetMorningPlan();
          router.push({ pathname: "/planning/morning" as const } as any);
        }}
        onViewParked={() =>
          router.push({ pathname: "/parked" as const } as any)
        }
      />

      <SectionHeader
        title="Today's Focus"
        subtitle="One manageable next step is enough"
      />
      <FocusSuggestionList
        suggestions={focusSuggestions}
        onStart={handleStartTask}
        onDone={toggleTask}
        onSnooze={(taskId) => shiftTaskDate(taskId, 2)}
        onLater={(taskId) => shiftTaskDate(taskId, 1)}
      />

      {/* Quick Actions */}
      <SectionHeader title="Quick Actions" />
      <QuickActions onQuickCapture={() => setIsQuickCaptureVisible(true)} />

      <DailyProgressCard
        title="Today's Progress"
        progress={completionRate}
        subtitle={supportiveLabel}
        completedCount={completedTodayItems}
        totalCount={totalTodayItems}
        variant="default"
      />

      <QuickCaptureSheet
        visible={isQuickCaptureVisible}
        onClose={() => setIsQuickCaptureVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  quickActionCard: {
    flex: 1,
    minWidth: "45%",
    padding: Spacing.md,
    borderLeftWidth: 3,
    alignItems: "flex-start",
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    fontWeight: "500",
  },
});
