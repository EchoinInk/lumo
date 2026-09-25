import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { Text } from "@/src/components/ui/Text";
import { Colors, Radius, Shadows, Spacing } from "@/src/theme/tokens";
import { toLocalDateKey } from "@/src/utils/dateTime";
import { LinearGradient } from "expo-linear-gradient";
import { Plus, X } from "lucide-react-native";
import React, { useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { useTasks } from "../hooks/useTasks";
import { TaskPriority } from "../types/task";

interface AddTaskModalProps {
    visible: boolean;
    onClose: () => void;
}

const priorities: { key: TaskPriority; label: string; color: string }[] = [
    { key: "low", label: "Low", color: Colors.blue },
    { key: "medium", label: "Medium", color: Colors.warning },
    { key: "high", label: "High", color: Colors.pink },
];

export function AddTaskModal({ visible, onClose }: AddTaskModalProps) {
    const { createTask } = useTasks();
    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("medium");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) return;

        setIsSubmitting(true);

        // Dismiss keyboard
        Keyboard.dismiss();

        // Create task
        createTask({
            title: title.trim(),
            description: notes.trim() || undefined,
            priority,
            dueDate: toLocalDateKey(),
        });

        // Reset and close
        setTitle("");
        setNotes("");
        setPriority("medium");
        setIsSubmitting(false);
        onClose();
    };

    const handleClose = () => {
        Keyboard.dismiss();
        onClose();
    };

    const isValid = title.trim().length > 0;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.keyboardView}
                    >
                        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                            <View style={styles.container}>
                                <Card variant="elevated" style={styles.sheet}>
                                    {/* Header */}
                                    <View style={styles.header}>
                                        <View style={styles.titleContainer}>
                                            <Text variant="title" style={styles.title}>
                                                Add a small step
                                            </Text>
                                            <Text
                                                variant="body"
                                                color={Colors.textSecondary}
                                                style={styles.subtitle}
                                            >
                                                Every big journey starts small
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={handleClose}
                                            style={styles.closeButton}
                                            activeOpacity={0.7}
                                        >
                                            <X size={24} color={Colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView
                                        showsVerticalScrollIndicator={false}
                                        keyboardShouldPersistTaps="handled"
                                    >
                                        {/* Task Title */}
                                        <View style={styles.inputGroup}>
                                            <Input
                                                label="What would you like to do?"
                                                placeholder="e.g., Take a 5-minute walk"
                                                value={title}
                                                onChangeText={setTitle}
                                                autoFocus
                                                returnKeyType="next"
                                                accessibilityLabel="Task title input"
                                            />
                                        </View>

                                        {/* Priority Selector */}
                                        <View style={styles.inputGroup}>
                                            <Text
                                                variant="label"
                                                color={Colors.textSecondary}
                                                style={styles.label}
                                            >
                                                How important is this?
                                            </Text>
                                            <View style={styles.priorityContainer}>
                                                {priorities.map((p) => (
                                                    <TouchableOpacity
                                                        key={p.key}
                                                        onPress={() => setPriority(p.key)}
                                                        activeOpacity={0.7}
                                                        accessibilityLabel={`${p.label} priority`}
                                                        accessibilityRole="button"
                                                        accessibilityState={{
                                                            selected: priority === p.key,
                                                        }}
                                                    >
                                                        <View
                                                            style={[
                                                                styles.priorityPill,
                                                                priority === p.key && {
                                                                    backgroundColor: p.color + "20",
                                                                    borderColor: p.color,
                                                                    borderWidth: 1,
                                                                },
                                                            ]}
                                                        >
                                                            <View
                                                                style={[
                                                                    styles.priorityDot,
                                                                    { backgroundColor: p.color },
                                                                ]}
                                                            />
                                                            <Text
                                                                variant="body"
                                                                color={
                                                                    priority === p.key
                                                                        ? p.color
                                                                        : Colors.textSecondary
                                                                }
                                                            >
                                                                {p.label}
                                                            </Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>

                                        {/* Notes (Optional) */}
                                        <View style={styles.inputGroup}>
                                            <Input
                                                label="Notes (optional)"
                                                placeholder="Any helpful details..."
                                                value={notes}
                                                onChangeText={setNotes}
                                                multiline
                                                numberOfLines={3}
                                                textAlignVertical="top"
                                                accessibilityLabel="Task notes input"
                                            />
                                        </View>

                                        {/* Spacer for bottom padding */}
                                        <View style={styles.spacer} />
                                    </ScrollView>

                                    {/* Action Buttons */}
                                    <View style={styles.actions}>
                                        <TouchableOpacity
                                            onPress={handleClose}
                                            style={styles.cancelButton}
                                            activeOpacity={0.7}
                                            accessibilityLabel="Cancel adding task"
                                            accessibilityRole="button"
                                        >
                                            <Text
                                                variant="body"
                                                color={Colors.textSecondary}
                                                style={styles.cancelText}
                                            >
                                                Not now
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={handleSubmit}
                                            disabled={!isValid || isSubmitting}
                                            activeOpacity={0.8}
                                            accessibilityLabel="Add task"
                                            accessibilityRole="button"
                                            accessibilityState={{
                                                disabled: !isValid || isSubmitting,
                                            }}
                                        >
                                            <LinearGradient
                                                colors={[Colors.pink, Colors.purple]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={[
                                                    styles.submitButton,
                                                    (!isValid || isSubmitting) &&
                                                        styles.submitButtonDisabled,
                                                ]}
                                            >
                                                <Plus
                                                    size={20}
                                                    color={Colors.textInverse}
                                                />
                                                <Text
                                                    variant="body"
                                                    color={Colors.textInverse}
                                                    style={styles.submitText}
                                                >
                                                    Add task
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </Card>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: Colors.overlay,
        justifyContent: "flex-end",
    },
    keyboardView: {
        justifyContent: "flex-end",
    },
    container: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Platform.OS === "ios" ? 34 : Spacing.lg,
    },
    sheet: {
        maxHeight: "85%",
        padding: Spacing.xl,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: Spacing.xl,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontWeight: "600",
        marginBottom: Spacing.xs,
    },
    subtitle: {
        lineHeight: 20,
    },
    closeButton: {
        padding: Spacing.sm,
        marginLeft: Spacing.md,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        marginBottom: Spacing.sm,
    },
    priorityContainer: {
        flexDirection: "row",
        gap: Spacing.md,
    },
    priorityPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radius.full,
        backgroundColor: Colors.lavender,
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    spacer: {
        height: Spacing.lg,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    cancelButton: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    cancelText: {
        fontWeight: "500",
    },
    submitButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: Radius["2xl"],
        ...Shadows.glow,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitText: {
        fontWeight: "600",
    },
});
