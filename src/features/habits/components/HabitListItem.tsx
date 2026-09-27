import { Card } from "@/src/components/ui/Card";
import { Text } from "@/src/components/ui/Text";
import { Colors, Radius, Spacing } from "@/src/theme/tokens";
import { CheckCircle2, Circle, Flame, History, Pencil, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { formatLocalDate } from "@/src/utils/dateTime";
import { Habit, HabitColor } from "../types/habit";

interface HabitListItemProps {
    habit: Habit;
    isCompleted: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    currentStreak?: number;
    historicalBest?: number;
    completionHistory?: string[];
    canToggle?: boolean;
}

const colorMap: Record<HabitColor, string> = {
    blue: Colors.blue,
    green: Colors.success,
    yellow: Colors.warning,
    orange: "#F97316",
    pink: Colors.pink,
    purple: Colors.purple,
    teal: "#14B8A6",
};

export function HabitListItem({
    habit,
    isCompleted,
    onToggle,
    onEdit,
    onDelete,
    currentStreak = 0,
    historicalBest = 0,
    completionHistory = [],
    canToggle = true,
}: HabitListItemProps) {
    const habitColor = colorMap[habit.color || "blue"];
    const [historyVisible, setHistoryVisible] = useState(false);

    return (
        <Card
            variant={isCompleted ? "outlined" : "elevated"}
            style={[
                styles.habitCard,
                !isCompleted && { borderLeftWidth: 3, borderLeftColor: habitColor },
            ]}
        >
            <View style={styles.habitRow}>
                <TouchableOpacity
                    onPress={onToggle}
                    disabled={!canToggle}
                    style={styles.habitContent}
                    activeOpacity={0.7}
                    accessibilityLabel={`${isCompleted ? "Completed" : "Pending"} habit: ${habit.title}`}
                    accessibilityRole="button"
                >
                    <View
                        style={[
                            styles.checkbox,
                            isCompleted && styles.checkboxChecked,
                            !isCompleted && { borderColor: habitColor },
                        ]}
                    >
                        {isCompleted ? (
                            <CheckCircle2 size={20} color={Colors.textInverse} />
                        ) : (
                            <Circle size={20} color={habitColor} />
                        )}
                    </View>

                    <View style={styles.habitInfo}>
                        <Text
                            variant="body"
                            style={[
                                styles.habitTitle,
                                isCompleted && styles.habitTitleCompleted,
                            ]}
                        >
                            {habit.title}
                        </Text>

                        {habit.description && (
                            <Text
                                variant="caption"
                                color={Colors.textTertiary}
                                style={styles.habitDescription}
                                numberOfLines={1}
                            >
                                {habit.description}
                            </Text>
                        )}

                        <View style={styles.habitMeta}>
                            {/* Frequency */}
                            <View style={[styles.badge, { backgroundColor: habitColor + "15" }]}>
                                <Text variant="small" color={habitColor}>
                                    {habit.frequency === "daily"
                                        ? "Daily"
                                        : habit.targetDays?.join(", ") || "Weekly"}
                                </Text>
                            </View>

                            {/* Streak */}
                            {currentStreak > 0 && (
                                <View style={[styles.streakBadge, { backgroundColor: Colors.warning + "15" }]}>
                                    <Flame size={12} color={Colors.warning} />
                                    <Text variant="small" color={Colors.warning}>
                                        {currentStreak} current
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={styles.habitActions}>
                    <TouchableOpacity
                        onPress={() => setHistoryVisible((visible) => !visible)}
                        style={styles.actionButton}
                        activeOpacity={0.6}
                        accessibilityLabel={`${historyVisible ? "Hide" : "Show"} history for habit: ${habit.title}`}
                        accessibilityRole="button"
                    >
                        <History size={16} color={Colors.textTertiary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onEdit}
                        style={styles.actionButton}
                        activeOpacity={0.6}
                        accessibilityLabel={`Edit habit: ${habit.title}`}
                        accessibilityRole="button"
                    >
                        <Pencil size={16} color={Colors.textTertiary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onDelete}
                        style={styles.actionButton}
                        activeOpacity={0.6}
                        accessibilityLabel={`Delete habit: ${habit.title}`}
                        accessibilityRole="button"
                    >
                        <Trash2 size={16} color={Colors.textTertiary} />
                    </TouchableOpacity>
                </View>
            </View>
            {historyVisible && (
                <View style={styles.historyPanel}>
                    <Text variant="small" color={Colors.textSecondary}>
                        Historical best: {historicalBest} {historicalBest === 1 ? "scheduled completion" : "scheduled completions"}
                    </Text>
                    {completionHistory.length === 0 ? (
                        <Text variant="small" color={Colors.textTertiary}>No completions recorded yet.</Text>
                    ) : (
                        completionHistory.map((date) => (
                            <Text key={date} variant="small" color={Colors.textTertiary}>
                                {formatLocalDate(date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                            </Text>
                        ))
                    )}
                </View>
            )}
        </Card>
    );
}

const styles = StyleSheet.create({
    habitCard: {
        padding: Spacing.md,
    },
    habitRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    habitContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        flex: 1,
    },
    checkbox: {
        width: 32,
        height: 32,
        borderRadius: Radius.md,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxChecked: {
        backgroundColor: Colors.success,
        borderColor: Colors.success,
    },
    habitInfo: {
        flex: 1,
    },
    habitTitle: {
        fontWeight: "500",
        marginBottom: Spacing.xs,
    },
    habitTitleCompleted: {
        textDecorationLine: "line-through",
        color: Colors.textTertiary,
    },
    habitDescription: {
        marginBottom: Spacing.xs,
    },
    habitMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    badge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    streakBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    habitActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
    },
    actionButton: {
        padding: Spacing.sm,
    },
    historyPanel: {
        gap: Spacing.xs,
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
});
