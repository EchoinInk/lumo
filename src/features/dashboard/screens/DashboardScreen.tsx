import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import { CalmModeBanner } from "@/src/features/calmMode/components/CalmModeBanner";
import { useEnvironmentalSoftening } from "@/src/features/calmMode/hooks/useEnvironmentalSoftening";
import { FocusModeBanner } from "@/src/features/focus/components/FocusModeBanner";
import { useCognitiveLoad } from "@/src/features/focus/hooks/useCognitiveLoad";
import { useFocusMode } from "@/src/features/focus/hooks/useFocusMode";
import { useHabits } from "@/src/features/habits";
import { useTasks } from "@/src/features/tasks";
import { useLocalDay } from "@/src/hooks/useLocalDay";
import { isLocalDateKey } from "@/src/utils/dateTime";
import { router } from "expo-router";
import { DailyProgressCard } from "../components/DailyProgressCard";
import { DashboardHeader } from "../components/DashboardHeader";
import { DashboardSection } from "../components/DashboardSection";
import { QuickActions } from "../components/QuickActions";
import { TodayFocusCard } from "../components/TodayFocusCard";
import { TodaysRoutinesCard } from "../components/TodaysRoutinesCard";
import { calculateDailyProgress } from "../utils/dashboardProgress";

export default function DashboardScreen() {
  const today = useLocalDay();
  // Focus Mode hooks
  const { isFocusModeEnabled, disableFocusMode } = useFocusMode();
  const { shouldShowSection, maxVisibleCards, shouldShowDecorativeElements } =
    useCognitiveLoad();

  // Calm Mode hooks
  const { isCalmModeEnabled } = useEnvironmentalSoftening();

  // Get real data from Tasks and Habits
  const {
    tasks,
    completedCount: completedTasks,
    toggleTask,
    hasHydrated: tasksHydrated,
  } = useTasks();
  const {
    todayHabits,
    completedToday: completedHabits,
    toggleHabit,
    isHydrated: habitsHydrated,
  } = useHabits();

  // Calculate daily progress
  const totalTasks = tasks.length;
  const totalHabits = todayHabits.length;
  const completedTaskCount = completedTasks;
  const completedHabitCount = completedHabits.length;

  const {
    completionRate,
    supportiveLabel,
    totalTodayItems,
    completedTodayItems,
  } = calculateDailyProgress(
    totalTasks,
    completedTaskCount,
    totalHabits,
    completedHabitCount,
  );

  // Prioritize tasks for Today's Focus
  const getPriorityScore = (task: (typeof tasks)[0]) => {
    let score = 0;
    if (task.completed) score -= 1000;
    if (task.priority === "high") score += 100;
    if (task.priority === "medium") score += 50;
    if (task.dueDate === today) score += 200;
    if (isLocalDateKey(task.dueDate) && task.dueDate < today) score += 150;
    score += new Date(task.createdAt).getTime() / 1000000000;
    return score;
  };

  const sortedTasks =
    tasksHydrated && tasks.length > 0
      ? [...tasks].sort((a, b) => getPriorityScore(b) - getPriorityScore(a))
      : [];

  // Respect maxVisibleCards from cognitive load profile
  const maxTasksToShow = maxVisibleCards;
  const focusTasks = sortedTasks.slice(0, maxTasksToShow);

  return (
    <Screen scrollable padded>
      {/* Focus Mode Banner */}
      {isFocusModeEnabled && <FocusModeBanner onExit={disableFocusMode} />}

      {/* Calm Mode Banner */}
      {isCalmModeEnabled && <CalmModeBanner />}

      {/* Header Section */}
      <DashboardHeader />

      {/* Today's Focus - always visible */}
      <DashboardSection title="Today's Focus" actionLabel="View All">
        <TodayFocusCard
          tasks={focusTasks}
          onToggle={toggleTask}
          onAddPress={() =>
            router.push({ pathname: "/(tabs)/tasks" as const } as any)
          }
        />
      </DashboardSection>

      {/* Compact Task Progress Card - below Today Focus in calm hierarchy */}
      <DailyProgressCard
        title="Today's Progress"
        progress={completionRate}
        subtitle={supportiveLabel}
        completedCount={completedTodayItems}
        totalCount={totalTodayItems}
        variant={shouldShowDecorativeElements ? "gradient" : "default"}
      />

      {/* Today's Routines - hide in minimal mode */}
      {shouldShowSection("habits") && (
        <DashboardSection title="Today's Routines">
          <TodaysRoutinesCard
            habits={todayHabits.slice(0, 4)}
            completedIds={completedHabits.map((h) => h.id)}
            onToggle={toggleHabit}
            onAddPress={() =>
              router.push({ pathname: "/(tabs)/more/habits" as const } as any)
            }
          />
        </DashboardSection>
      )}

      {/* Quick Actions - hide in minimal mode */}
      {shouldShowSection("quickActions") && (
        <DashboardSection title="Quick Actions">
          <QuickActions />
        </DashboardSection>
      )}

      {/* Empty State Demo - hide in minimal mode */}
      {shouldShowSection("suggestions") && (
        <DashboardSection title="Upcoming">
          <EmptyState
            title="No upcoming events"
            description="You're all caught up for today"
          />
        </DashboardSection>
      )}
    </Screen>
  );
}
