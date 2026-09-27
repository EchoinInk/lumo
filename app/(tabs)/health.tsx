import { LoadingState } from "@/src/components/feedback";
import { Card } from "@/src/components/ui/Card";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { ProgressBar } from "@/src/components/ui/ProgressBar";
import { Screen } from "@/src/components/ui/Screen";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Text } from "@/src/components/ui/Text";
import { HabitFormModal } from "@/src/features/habits/components/HabitFormModal";
import { HabitListItem } from "@/src/features/habits/components/HabitListItem";
import { useHabits } from "@/src/features/habits/hooks/useHabits";
import { CreateHabitInput, Habit } from "@/src/features/habits/types/habit";
import { dailyCalorieSummary } from "@/src/features/calories/services/calorieSelectors";
import { useCaloriePreferencesStore } from "@/src/features/calories/store/useCaloriePreferencesStore";
import { MealFormSheet } from "@/src/features/meals/components/MealFormSheet";
import { useMealStore } from "@/src/features/meals/store/useMealStore";
import type { MealEntry, MealEntryInput } from "@/src/features/meals/types/meal";
import { latestWeight, weightChangeGrams } from "@/src/features/weight/services/weightSelectors";
import { formatWeight, gramsToUnit } from "@/src/features/weight/services/weightUnits";
import { useWeightStore } from "@/src/features/weight/store/useWeightStore";
import { workoutSummaryForRange } from "@/src/features/workouts/services/workoutSelectors";
import { useWorkoutStore } from "@/src/features/workouts/store/useWorkoutStore";
import { useLocalDay } from "@/src/hooks/useLocalDay";
import { addLocalDays, formatLocalDate } from "@/src/utils/dateTime";
import { Colors, Radius, Shadows, Spacing } from "@/src/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowRight,
  Dumbbell,
  Flame,
  ChevronLeft,
  ChevronRight,
  Plus,
  Ruler,
  Scale,
  Utensils,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

function mondayFor(date: string): string { const value = new Date(`${date}T12:00:00`); return addLocalDays(date, -((value.getDay() + 6) % 7)); }

// Quick links to health screens
const healthLinks = [
  {
    title: "My Habits",
    icon: Flame,
    color: Colors.purple,
    route: "/(tabs)/more/habits",
  },
  {
    title: "My Meals",
    icon: Utensils,
    color: Colors.pink,
    route: "/(tabs)/more/meals",
  },
  {
    title: "Weight Tracker",
    icon: Scale,
    color: Colors.primary,
    route: "/(tabs)/more/weight",
  },
  {
    title: "Workout Log",
    icon: Dumbbell,
    color: Colors.warning,
    route: "/(tabs)/more/workouts",
  },
  {
    title: "Body Measurements",
    icon: Ruler,
    color: Colors.purple,
    route: "/(tabs)/more/measurements",
  },
];

export default function HealthScreen() {
  const today = useLocalDay(); const meals = useMealStore(); const caloriePreferences = useCaloriePreferencesStore(); const weight = useWeightStore(); const workouts = useWorkoutStore();
  const [calorieDate, setCalorieDate] = useState(today); const calorieSummary = useMemo(() => dailyCalorieSummary(meals.meals, calorieDate), [meals.meals, calorieDate]);
  const goal = caloriePreferences.preferences.dailyGoalKcal; const calorieProgress = goal ? Math.min(100, calorieSummary.knownCalories * 100 / goal) : 0;
  const latestWeightEntry = latestWeight(weight.state.entries); const weightChange = weightChangeGrams(weight.state.entries); const weightUnit = weight.state.preferredUnit;
  const workoutWeekStart = mondayFor(today); const workoutSummary = useMemo(() => workoutSummaryForRange(workouts.workouts, workoutWeekStart, addLocalDays(workoutWeekStart, 7)), [workouts.workouts, workoutWeekStart]);
  const [mealVisible, setMealVisible] = useState(false); const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null); const [mealSaving, setMealSaving] = useState(false);
  const [goalVisible, setGoalVisible] = useState(false); const [goalInput, setGoalInput] = useState(""); const [goalError, setGoalError] = useState<string | null>(null);
  const saveMeal = async (input: MealEntryInput) => { setMealSaving(true); try { if (editingMeal) await meals.updateMeal(editingMeal.id, input); else await meals.createMeal(input); setMealVisible(false); setEditingMeal(null); } finally { setMealSaving(false); } };
  const saveGoal = async () => { const value = goalInput.trim() ? Number(goalInput) : null; if (value !== null && (!Number.isSafeInteger(value) || value <= 0)) return setGoalError("Enter a positive whole-number goal, or leave it blank for no goal."); try { await caloriePreferences.setGoal(value); setGoalVisible(false); } catch { setGoalError("Could not save the calorie goal."); } };

  // Real habits data
  const {
    todayHabits,
    completedToday,
    completionRate,
    totalStreak,
    isHydrated,
    isLoading,
    error,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabit,
    isCompletedToday,
  } = useHabits();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedHabit, setSelectedHabit] = useState<Habit | undefined>(
    undefined,
  );

  const handleAddPress = () => {
    setModalMode("create");
    setSelectedHabit(undefined);
    setIsModalVisible(true);
  };

  const handleEditPress = (habit: Habit) => {
    setModalMode("edit");
    setSelectedHabit(habit);
    setIsModalVisible(true);
  };

  const handleModalSubmit = async (data: CreateHabitInput) => {
    if (modalMode === "edit" && selectedHabit) {
      await updateHabit(selectedHabit.id, data);
      return;
    }
    await addHabit(data);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedHabit(undefined);
  };

  // Loading state
  if (!isHydrated) {
    return (
      <Screen scrollable padded>
        <LoadingState message="Loading your health data..." />
      </Screen>
    );
  }

  return (
    <Screen scrollable padded>
      {/* Header */}
      <SectionHeader title="Health" subtitle="Your wellness journey" />

      {error && (
        <Card variant="outlined" style={styles.errorCard}>
          <Text variant="small" color={Colors.danger} accessibilityRole="alert">
            {error}
          </Text>
        </Card>
      )}
      {(meals.error || caloriePreferences.error || weight.error || workouts.error) && <Card variant="outlined" style={styles.errorCard}><Text variant="small" color={Colors.danger} accessibilityRole="alert">{meals.error ?? caloriePreferences.error ?? weight.error ?? workouts.error}</Text></Card>}

      {/* Habits Summary */}
      <Card variant="elevated" style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: Colors.purple + "15" },
            ]}
          >
            <Flame size={22} color={Colors.purple} />
          </View>
          <View style={styles.summaryTitle}>
            <Text variant="body" style={styles.summaryLabel}>
              Habits
            </Text>
            <Text variant="caption" color={Colors.textSecondary}>
              {isHydrated ? `${totalStreak} day total streak` : "Loading..."}
            </Text>
          </View>
          <Text variant="subheading" style={styles.summaryValue}>
            {isHydrated
              ? `${completedToday.length}/${todayHabits.length}`
              : "-/-"}
          </Text>
        </View>
        <ProgressBar
          progress={isHydrated ? completionRate : 0}
          height={8}
          variant="gradient"
        />
      </Card>

      {/* Today's Habits List */}
      <SectionHeader title="Today's Habits" />

      {isLoading && (
        <Card variant="outlined" style={styles.emptyCard}>
          <Text variant="body" color={Colors.textSecondary}>
            Loading your habits...
          </Text>
        </Card>
      )}

      {!isLoading && todayHabits.length === 0 && (
        <Card variant="outlined" style={styles.emptyCard}>
          <Text
            variant="body"
            color={Colors.textSecondary}
            style={styles.emptyTitle}
          >
            Nothing needs your attention here yet.
          </Text>
          <Text variant="caption" color={Colors.textTertiary}>
            Add a gentle routine when you are ready.
          </Text>
        </Card>
      )}

      <View style={styles.habitList}>
        {todayHabits.map((habit) => (
          <HabitListItem
            key={habit.id}
            habit={habit}
            isCompleted={isCompletedToday(habit)}
            onToggle={() => {
              void toggleHabit(habit.id).catch(() => undefined);
            }}
            onEdit={() => handleEditPress(habit)}
            onDelete={() => {
              void deleteHabit(habit.id).catch(() => undefined);
            }}
          />
        ))}
      </View>

      {/* Add Habit Button */}
      <TouchableOpacity
        style={styles.addButton}
        activeOpacity={0.8}
        onPress={handleAddPress}
        accessibilityLabel="Add new habit"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[Colors.pink, Colors.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <Plus size={20} color={Colors.textInverse} />
          <Text
            variant="body"
            color={Colors.textInverse}
            style={styles.addButtonText}
          >
            Add Habit
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Habit Form Modal */}
      <HabitFormModal
        visible={isModalVisible}
        mode={modalMode}
        initialHabit={selectedHabit}
        onSubmit={handleModalSubmit}
        onClose={handleModalClose}
      />

      {/* Calories derive only from consumed meals. */}
      <Card variant="elevated" style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: Colors.pink + "15" },
            ]}
          >
            <Utensils size={22} color={Colors.pink} />
          </View>
          <View style={styles.summaryTitle}>
            <Text variant="body" style={styles.summaryLabel}>
              Calories
            </Text>
            <Text variant="caption" color={Colors.textSecondary}>{formatLocalDate(calorieDate, { month: "short", day: "numeric", year: "numeric" })}</Text>
          </View>
          <Text variant="subheading" style={styles.summaryValue}>
            {calorieSummary.knownCalories} kcal
          </Text>
        </View>
        {goal !== null && <ProgressBar progress={calorieProgress} height={8} variant="default" />}
        <Text variant="caption" color={Colors.textSecondary} style={styles.goalText}>{goal === null ? "No calorie goal configured" : `Goal: ${goal} kcal`}{calorieSummary.unknownEntryCount ? ` · ${calorieSummary.unknownEntryCount} ${calorieSummary.unknownEntryCount === 1 ? "entry has" : "entries have"} unknown calories` : ""}</Text>
        <View style={styles.inlineActions}><Button size="sm" variant="ghost" onPress={() => setCalorieDate(addLocalDays(calorieDate, -1))} leftIcon={<ChevronLeft size={16}/>}>Earlier</Button><Button size="sm" variant="ghost" disabled={calorieDate >= today} onPress={() => setCalorieDate(addLocalDays(calorieDate, 1))} rightIcon={<ChevronRight size={16}/>}>Later</Button><Button size="sm" variant="ghost" onPress={() => { setGoalInput(goal?.toString() ?? ""); setGoalError(null); setGoalVisible(true); }}>Goal</Button></View>
        {calorieSummary.entries.length === 0 ? <Text variant="small" color={Colors.textTertiary}>No consumed meals recorded for this date.</Text> : <View style={styles.calorieEntries}>{calorieSummary.entries.map((meal) => <View key={meal.id} style={styles.calorieRow}><View style={styles.summaryTitle}><Text variant="small">{meal.name}</Text><Text variant="small" color={Colors.textTertiary}>{meal.nutrition?.calories === undefined ? "Calories unknown" : `${meal.nutrition.calories} kcal`}</Text></View><Button size="sm" variant="ghost" onPress={() => { setEditingMeal(meal); setMealVisible(true); }}>Edit</Button><Button size="sm" variant="ghost" onPress={() => void meals.deleteMeal(meal.id).catch(() => undefined)}>Delete</Button></View>)}</View>}
        <Button size="sm" onPress={() => { setEditingMeal(null); setMealVisible(true); }}>Quick add consumed intake</Button>
      </Card>

      {/* Weight Summary */}
      <Card variant="elevated" style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: Colors.primary + "15" },
            ]}
          >
            <Scale size={22} color={Colors.primary} />
          </View>
          <View style={styles.summaryTitle}>
            <Text variant="body" style={styles.summaryLabel}>
              Weight
            </Text>
            <Text variant="caption" color={Colors.textSecondary}>
              Current
            </Text>
          </View>
          <View style={styles.weightValue}>
            <Text variant="subheading" style={styles.summaryValue}>
              {latestWeightEntry ? formatWeight(latestWeightEntry.grams, weightUnit) : "No entries"}
            </Text>
            {weightChange !== null && <Text variant="small" color={Colors.textSecondary}>{weightChange > 0 ? "+" : ""}{gramsToUnit(weightChange, weightUnit).toFixed(1)} {weightUnit} from prior entry</Text>}
          </View>
        </View>
      </Card>

      <MealFormSheet visible={mealVisible} meal={editingMeal} defaultDate={calorieDate} saving={mealSaving} onClose={() => setMealVisible(false)} onSave={saveMeal}/>
      <BottomSheet visible={goalVisible} onClose={() => setGoalVisible(false)}><Text variant="heading">Daily calorie goal</Text><View style={styles.goalForm}><Input label="Goal in kcal (optional)" value={goalInput} onChangeText={setGoalInput} keyboardType="number-pad" helperText="Leave blank to use no goal."/>{goalError && <Text color={Colors.danger} accessibilityRole="alert">{goalError}</Text>}<View style={styles.inlineActions}><Button style={styles.formButton} variant="ghost" onPress={() => setGoalVisible(false)}>Cancel</Button><Button style={styles.formButton} loading={caloriePreferences.isSaving} onPress={() => void saveGoal()}>Save</Button></View></View></BottomSheet>

      {/* Workout Summary */}
      <Card variant="elevated" style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: Colors.warning + "15" },
            ]}
          >
            <Dumbbell size={22} color={Colors.warning} />
          </View>
          <View style={styles.summaryTitle}>
            <Text variant="body" style={styles.summaryLabel}>
              Workouts
            </Text>
            <Text variant="caption" color={Colors.textSecondary}>
              This week
            </Text>
          </View>
          <View style={styles.weightValue}>
            <Text variant="subheading" style={styles.summaryValue}>
              {workoutSummary.count}
            </Text>
            <Text variant="caption" color={Colors.textSecondary}>
              {workoutSummary.durationMinutes} min{workoutSummary.calorieEntryCount ? ` · ${workoutSummary.knownCalories} manually recorded kcal` : " · no calorie estimates"}
            </Text>
          </View>
        </View>
      </Card>

      {/* Quick Links */}
      <SectionHeader title="Health Tools" />
      <View style={styles.linksGrid}>
        {healthLinks.map((link) => (
          <TouchableOpacity
            key={link.title}
            onPress={() => router.push(link.route as any)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={link.title}
            accessibilityHint={`Opens ${link.title}`}
          >
            <Card variant="elevated" style={styles.linkCard}>
              <View
                style={[
                  styles.linkIcon,
                  { backgroundColor: link.color + "15" },
                ]}
              >
                <link.icon size={20} color={link.color} />
              </View>
              <Text variant="body" style={styles.linkTitle}>
                {link.title}
              </Text>
              <ArrowRight size={16} color={Colors.textTertiary} />
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* Calm note */}
      <Card variant="outlined" style={styles.placeholderCard}>
        <Text variant="body" color={Colors.textSecondary}>
          This space is coming together.
        </Text>
        <Text variant="caption" color={Colors.textTertiary}>
          Nothing needs your attention here yet.
        </Text>
      </Card>
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
  summaryCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  summaryLabel: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontWeight: "600",
  },
  weightValue: {
    alignItems: "flex-end",
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.success + "15",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
  },
  goalText: {
    marginTop: Spacing.sm,
  },
  inlineActions: { flexDirection: "row", gap: Spacing.sm, flexWrap: "wrap", marginTop: Spacing.sm },
  calorieEntries: { gap: Spacing.xs, marginTop: Spacing.md },
  calorieRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  goalForm: { gap: Spacing.md, marginTop: Spacing.lg },
  formButton: { flex: 1 },
  linksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  linkCard: {
    flex: 1,
    minWidth: "45%",
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  linkTitle: {
    flex: 1,
    fontWeight: "500",
  },
  placeholderCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  habitList: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  addButton: {
    marginBottom: Spacing.xl,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius["2xl"],
    ...Shadows.glow,
  },
  addButtonText: {
    fontWeight: "600",
  },
  emptyCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    alignItems: "center",
  },
  emptyTitle: {
    marginBottom: Spacing.xs,
  },
});
