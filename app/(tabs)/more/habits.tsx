import { LoadingState } from "@/src/components/feedback";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Text } from "@/src/components/ui/Text";
import { HabitFormModal } from "@/src/features/habits/components/HabitFormModal";
import { HabitListItem } from "@/src/features/habits/components/HabitListItem";
import { useHabits } from "@/src/features/habits/hooks/useHabits";
import { CreateHabitInput, Habit } from "@/src/features/habits/types/habit";
import { MoreScreenHeader } from "@/src/features/more/components";
import { Colors, Radius, Shadows, Spacing } from "@/src/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { Flame, Plus } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

export default function HabitsScreen() {
  const {
    habits,
    todayHabits,
    completedToday,
    completionRate,
    totalStreak,
    bestStreak,
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
        <LoadingState message="Loading your habits..." />
      </Screen>
    );
  }

  return (
    <Screen scrollable padded>
      <MoreScreenHeader title="My Habits" subtitle="Daily Tracking" />

      {error && (
        <Card variant="outlined" style={styles.errorCard}>
          <Text variant="small" color={Colors.danger} accessibilityRole="alert">
            {error}
          </Text>
        </Card>
      )}

      {/* Stats Summary */}
      <Card variant="gradient" style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <Text variant="caption" color={Colors.textInverse}>
            Today
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text variant="heading" color={Colors.textInverse}>
                {isHydrated ? completedToday.length : "-"}
              </Text>
              <Text variant="caption" color={Colors.textInverse}>
                Completed
              </Text>
            </View>
            <View style={styles.summaryStat}>
              <View style={styles.streakRow}>
                <Flame size={16} color={Colors.warning} />
                <Text variant="heading" color={Colors.textInverse}>
                  {isHydrated ? bestStreak : "-"}
                </Text>
              </View>
              <Text variant="caption" color={Colors.textInverse}>
                Best Streak
              </Text>
            </View>
            <View style={styles.summaryStat}>
              <Text variant="heading" color={Colors.textInverse}>
                {isHydrated ? `${completionRate}%` : "-"}
              </Text>
              <Text variant="caption" color={Colors.textInverse}>
                Success Rate
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Habits List */}
      <SectionHeader
        title={`Today's Habits (${isHydrated ? completedToday.length : "-"}/${isHydrated ? todayHabits.length : "-"})`}
      />

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
            No habits yet
          </Text>
          <Text variant="caption" color={Colors.textTertiary}>
            Add a gentle routine to get started
          </Text>
        </Card>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.habitsList}
      >
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
      </ScrollView>

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
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  summaryContent: {
    alignItems: "center",
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: Spacing.md,
  },
  summaryStat: {
    alignItems: "center",
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  habitsList: {
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
