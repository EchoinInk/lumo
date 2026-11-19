import { Input } from "@/src/components/ui/Input";
import { Text } from "@/src/components/ui/Text";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import { Radius, Shadows, Spacing } from "@/src/theme/tokens";
import { MutationSubmissionGuard } from "@/src/services/storage/durableMutation";
import { LinearGradient } from "expo-linear-gradient";
import { Check, Plus, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { CreateHabitInput, Habit, HabitColor, HabitFrequency } from "../types/habit";

interface HabitFormModalProps {
    visible: boolean;
    mode: "create" | "edit";
    initialHabit?: Habit;
    onSubmit: (data: CreateHabitInput) => Promise<unknown>;
    onClose: () => void;
}

const frequencies: { key: HabitFrequency; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
];

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const useHabitColors = createThemedValue((palette): { key: HabitColor; color: string }[] => [
    { key: "blue", color: palette.blue },
    { key: "green", color: palette.success },
    { key: "yellow", color: palette.warning },
    { key: "orange", color: "#F97316" },
    { key: "pink", color: palette.pink },
    { key: "purple", color: palette.purple },
    { key: "teal", color: "#14B8A6" },
]);

export function HabitFormModal({
    visible,
    mode,
    initialHabit,
    onSubmit,
    onClose,
}: HabitFormModalProps) {
  const palette = usePalette();
  const styles = useStyles();
  const habitColors = useHabitColors();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [frequency, setFrequency] = useState<HabitFrequency>("daily");
    const [targetDays, setTargetDays] = useState<string[]>([]);
    const [color, setColor] = useState<HabitColor>("blue");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const submissionGuard = useRef(new MutationSubmissionGuard()).current;

    // Initialize form when modal opens
    useEffect(() => {
        if (visible) {
            setSubmitError(null);
            submissionGuard.end();
            setIsSubmitting(false);
            if (mode === "edit" && initialHabit) {
                setTitle(initialHabit.title);
                setDescription(initialHabit.description || "");
                setFrequency(initialHabit.frequency);
                setTargetDays(initialHabit.targetDays || []);
                setColor(initialHabit.color || "blue");
            } else {
                // Reset for create mode
                setTitle("");
                setDescription("");
                setFrequency("daily");
                setTargetDays([]);
                setColor("blue");
            }
        }
    }, [visible, mode, initialHabit, submissionGuard]);

    const handleSubmit = async () => {
        if (!title.trim() || (frequency === "weekly" && targetDays.length === 0)) {
            setSubmitError("Choose at least one day for a weekly habit.");
            return;
        }
        if (!submissionGuard.begin()) return;

        setIsSubmitting(true);
        setSubmitError(null);
        Keyboard.dismiss();

        const data: CreateHabitInput = {
            title: title.trim(),
            description: description.trim() || undefined,
            frequency,
            color,
        };

        // Only include targetDays for weekly habits
        if (frequency === "weekly") {
            data.targetDays = targetDays;
        }

        try {
            await onSubmit(data);
            onClose();
        } catch {
            setSubmitError("This routine wasn't saved. Please try again.");
        } finally {
            submissionGuard.end();
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (submissionGuard.isActive()) return;
        Keyboard.dismiss();
        onClose();
    };

    const toggleDay = (day: string) => {
        setTargetDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const isValid = title.trim().length > 0 &&
        (frequency === "daily" || targetDays.length > 0);
    const titleText = mode === "edit" ? "Edit routine" : "Add a gentle routine";
    const subtitleText = mode === "edit" ? "Make it work for you" : "Small steps, steady progress";
    const submitText = mode === "edit" ? "Save changes" : "Add routine";

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.modalRoot}>
                <Pressable
                    style={styles.backdrop}
                    onPress={handleClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close habit form"
                />
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    pointerEvents="box-none"
                    style={styles.keyboardView}
                >
                    <View style={styles.container}>
                                <View style={styles.sheet}>
                                    {/* Header */}
                                    <View style={styles.header}>
                                        <View style={styles.titleContainer}>
                                            <Text variant="title" style={styles.title}>
                                                {titleText}
                                            </Text>
                                            <Text
                                                variant="body"
                                                color={palette.textSecondary}
                                                style={styles.subtitle}
                                            >
                                                {subtitleText}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={handleClose}
                                            style={styles.closeButton}
                                            activeOpacity={0.7}
                                        >
                                            <X size={24} color={palette.textSecondary} />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView
                                        showsVerticalScrollIndicator={false}
                                        keyboardShouldPersistTaps="handled"
                                    >
                                        {/* Habit Title */}
                                        <View style={styles.inputGroup}>
                                            <Input
                                                label="What gentle routine would you like?"
                                                placeholder="e.g., Drink a glass of water"
                                                value={title}
                                                onChangeText={setTitle}
                                                autoFocus={mode === "create"}
                                                returnKeyType="next"
                                                accessibilityLabel="Habit title input"
                                            />
                                        </View>

                                        {/* Frequency Selector */}
                                        <View style={styles.inputGroup}>
                                            <Text
                                                variant="label"
                                                color={palette.textSecondary}
                                                style={styles.label}
                                            >
                                                How often?
                                            </Text>
                                            <View style={styles.frequencyContainer}>
                                                {frequencies.map((f) => (
                                                    <TouchableOpacity
                                                        key={f.key}
                                                        onPress={() => setFrequency(f.key)}
                                                        activeOpacity={0.7}
                                                        accessibilityLabel={`${f.label} frequency`}
                                                        accessibilityRole="button"
                                                        accessibilityState={{
                                                            selected: frequency === f.key,
                                                        }}
                                                    >
                                                        <View
                                                            style={[
                                                                styles.frequencyChip,
                                                                frequency === f.key && {
                                                                    backgroundColor: palette.purple + "20",
                                                                    borderColor: palette.purple,
                                                                    borderWidth: 1,
                                                                },
                                                            ]}
                                                        >
                                                            <Text
                                                                variant="body"
                                                                color={
                                                                    frequency === f.key
                                                                        ? palette.purple
                                                                        : palette.textSecondary
                                                                }
                                                            >
                                                                {f.label}
                                                            </Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>

                                        {/* Target Days for Weekly */}
                                        {frequency === "weekly" && (
                                            <View style={styles.inputGroup}>
                                                <Text
                                                    variant="label"
                                                    color={palette.textSecondary}
                                                    style={styles.label}
                                                >
                                                    Which days?
                                                </Text>
                                                <View style={styles.daysContainer}>
                                                    {daysOfWeek.map((day) => (
                                                        <TouchableOpacity
                                                            key={day}
                                                            onPress={() => toggleDay(day)}
                                                            activeOpacity={0.7}
                                                            accessibilityLabel={`${day} ${targetDays.includes(day) ? "selected" : "not selected"}`}
                                                            accessibilityRole="button"
                                                        >
                                                            <View
                                                                style={[
                                                                    styles.dayChip,
                                                                    targetDays.includes(day) && {
                                                                        backgroundColor: palette.purple + "20",
                                                                        borderColor: palette.purple,
                                                                        borderWidth: 1,
                                                                    },
                                                                ]}
                                                            >
                                                                <Text
                                                                    variant="small"
                                                                    color={
                                                                        targetDays.includes(day)
                                                                            ? palette.purple
                                                                            : palette.textSecondary
                                                                    }
                                                                >
                                                                    {day}
                                                                </Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                                {targetDays.length === 0 && (
                                                    <Text variant="small" color={palette.danger}>
                                                        Choose at least one day.
                                                    </Text>
                                                )}
                                            </View>
                                        )}

                                        {/* Color Selector */}
                                        <View style={styles.inputGroup}>
                                            <Text
                                                variant="label"
                                                color={palette.textSecondary}
                                                style={styles.label}
                                            >
                                                Choose a color
                                            </Text>
                                            <View style={styles.colorContainer}>
                                                {habitColors.map((c) => (
                                                    <TouchableOpacity
                                                        key={c.key}
                                                        onPress={() => setColor(c.key)}
                                                        activeOpacity={0.7}
                                                        accessibilityLabel={`${c.key} color`}
                                                        accessibilityRole="button"
                                                        accessibilityState={{
                                                            selected: color === c.key,
                                                        }}
                                                    >
                                                        <View
                                                            style={[
                                                                styles.colorCircle,
                                                                { backgroundColor: c.color },
                                                                color === c.key && styles.colorCircleSelected,
                                                            ]}
                                                        >
                                                            {color === c.key && (
                                                                <Check size={14} color={palette.textInverse} />
                                                            )}
                                                        </View>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>

                                        {/* Description (Optional) */}
                                        <View style={styles.inputGroup}>
                                            <Input
                                                label="Notes (optional)"
                                                placeholder="Any helpful reminders..."
                                                value={description}
                                                onChangeText={setDescription}
                                                multiline
                                                numberOfLines={2}
                                                textAlignVertical="top"
                                                accessibilityLabel="Habit notes input"
                                            />
                                        </View>

                                        {/* Spacer for bottom padding */}
                                        <View style={styles.spacer} />
                                    </ScrollView>

                                    {submitError && (
                                        <Text
                                            variant="small"
                                            color={palette.danger}
                                            style={styles.submitError}
                                            accessibilityRole="alert"
                                        >
                                            {submitError}
                                        </Text>
                                    )}

                                    {/* Action Buttons */}
                                    <View style={styles.actions}>
                                        <TouchableOpacity
                                            onPress={handleClose}
                                            style={styles.cancelButton}
                                            activeOpacity={0.7}
                                            accessibilityLabel={mode === "edit" ? "Cancel editing" : "Cancel adding habit"}
                                            accessibilityRole="button"
                                        >
                                            <Text
                                                variant="body"
                                                color={palette.textSecondary}
                                                style={styles.cancelText}
                                            >
                                                Not now
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={handleSubmit}
                                            disabled={!isValid || isSubmitting}
                                            activeOpacity={0.8}
                                            accessibilityLabel={submitText}
                                            accessibilityRole="button"
                                            accessibilityState={{
                                                disabled: !isValid || isSubmitting,
                                            }}
                                        >
                                            <LinearGradient
                                                colors={[palette.pink, palette.purple]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={[
                                                    styles.submitButton,
                                                    (!isValid || isSubmitting) &&
                                                        styles.submitButtonDisabled,
                                                ]}
                                            >
                                                {mode === "edit" ? (
                                                    <Check size={20} color={palette.textInverse} />
                                                ) : (
                                                    <Plus size={20} color={palette.textInverse} />
                                                )}
                                                <Text
                                                    variant="body"
                                                    color={palette.textInverse}
                                                    style={styles.submitText}
                                                >
                                                    {submitText}
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
    modalRoot: {
        position: 'absolute',
        inset: 0,
        justifyContent: "flex-end",
    },
    backdrop: {
        position: 'absolute',
        inset: 0,
        backgroundColor: palette.overlay,
        zIndex: 1,
    },
    keyboardView: {
        position: 'absolute',
        inset: 0,
        justifyContent: "flex-end",
        zIndex: 2,
        elevation: 2,
    },
    container: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Platform.OS === "ios" ? 34 : Spacing.lg,
        zIndex: 3,
        elevation: 3,
    },
    sheet: {
        backgroundColor: palette.card,
        borderRadius: Radius["3xl"],
        maxHeight: "85%",
        padding: Spacing.xl,
        ...Shadows.xl,
        zIndex: 4,
        elevation: 4,
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
    frequencyContainer: {
        flexDirection: "row",
        gap: Spacing.md,
    },
    frequencyChip: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radius.full,
        backgroundColor: palette.lavender,
    },
    daysContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
    },
    dayChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.md,
        backgroundColor: palette.lavender,
        minWidth: 44,
        alignItems: "center",
    },
    colorContainer: {
        flexDirection: "row",
        gap: Spacing.md,
    },
    colorCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    colorCircleSelected: {
        borderWidth: 2,
        borderColor: palette.textInverse,
        ...Shadows.sm,
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
        borderTopColor: palette.border,
    },
    submitError: {
        marginTop: Spacing.sm,
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
}));
