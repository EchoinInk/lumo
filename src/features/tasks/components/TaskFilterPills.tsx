import { Text } from "@/components/ui/Text";
import { UX } from "@/constants/ux";
import { createThemedValue } from "@/theme/usePalette";
import { Spacing } from "@/theme/tokens";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { TaskFilter } from "../types/task";

interface TaskFilterPillsProps {
  selectedFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
}

const filters: { value: TaskFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function TaskFilterPills({
  selectedFilter,
  onFilterChange,
}: TaskFilterPillsProps) {
  const styles = useStyles();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.value}
          onPress={() => onFilterChange(filter.value)}
          activeOpacity={0.7}
          style={[
            styles.pill,
            selectedFilter === filter.value && styles.pillActive,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Show ${filter.label.toLowerCase()} tasks`}
          accessibilityState={{ selected: selectedFilter === filter.value }}
        >
          <Text
            variant="label"
            style={[
              styles.pillText,
              selectedFilter === filter.value && styles.pillTextActive,
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: UX.touchTarget,
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  pillActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  pillText: {
    color: palette.textSecondary,
  },
  pillTextActive: {
    color: palette.textInverse,
  },
}));
