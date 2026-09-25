import { Input } from "@/src/components/ui/Input";
import { Text } from "@/src/components/ui/Text";
import { Colors, Radius, Shadows, Spacing } from "@/src/theme/tokens";
import { MutationSubmissionGuard } from "@/src/services/storage/durableMutation";
import {
  addLocalDays,
  isLocalDateKey,
  isWallClockTime,
  toLocalDateKey,
} from "@/src/utils/dateTime";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, Check, Clock, Plus, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
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
import { EnergyPicker } from "./EnergyPicker";
import { RecurringTaskPicker } from "./RecurringTaskPicker";
import type { EnergyLevel } from "../types/energy";
import type { RecurrencePattern } from "../types/recurrence";
import { CreateTaskInput, Task, TaskPriority } from "../types/task";

interface TaskFormModalProps {
  visible: boolean;
  mode: "create" | "edit";
  initialTask?: Task;
  onSubmit: (data: CreateTaskInput) => Promise<unknown>;
  onClose: () => void;
}

const priorities: { key: TaskPriority; label: string; color: string }[] = [
  { key: "low", label: "Low", color: Colors.blue },
  { key: "medium", label: "Medium", color: Colors.warning },
  { key: "high", label: "High", color: Colors.pink },
];

const dateOptions = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "none", label: "No date" },
];

export function TaskFormModal({
  visible,
  mode,
  initialTask,
  onSubmit,
  onClose,
}: TaskFormModalProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [selectedDate, setSelectedDate] = useState<string>("none");
  const [dueTime, setDueTime] = useState<string>("");
  const [energyRequired, setEnergyRequired] = useState<EnergyLevel | undefined>();
  const [recurrence, setRecurrence] = useState<RecurrencePattern | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submissionGuard = useRef(new MutationSubmissionGuard()).current;

  // Initialize form when modal opens or initialTask changes
  useEffect(() => {
    if (visible) {
      setSubmitError(null);
      submissionGuard.end();
      setIsSubmitting(false);
      if (mode === "edit" && initialTask) {
        setTitle(initialTask.title);
        setNotes(initialTask.description || "");
        setPriority(initialTask.priority);
        setEnergyRequired(initialTask.energyRequired);
        setRecurrence(initialTask.recurrence);
        setDueTime(initialTask.dueTime || "");

        // Determine date selection from dueDate
        if (initialTask.dueDate) {
          const today = toLocalDateKey();
          const tomorrow = addLocalDays(today, 1);
          if (initialTask.dueDate === today) {
            setSelectedDate("today");
          } else if (initialTask.dueDate === tomorrow) {
            setSelectedDate("tomorrow");
          } else {
            setSelectedDate(initialTask.dueDate);
          }
        } else {
          setSelectedDate("none");
        }
      } else {
        // Reset for create mode
        setTitle("");
        setNotes("");
        setPriority("medium");
        setEnergyRequired(undefined);
        setRecurrence(undefined);
        setSelectedDate("none");
        setDueTime("");
      }
    }
  }, [visible, mode, initialTask, submissionGuard]);

  const handleSubmit = async () => {
    const normalizedDueTime = dueTime.trim();
    const unchangedLegacyTime =
      mode === "edit" && normalizedDueTime === initialTask?.dueTime;
    if (
      normalizedDueTime &&
      !isWallClockTime(normalizedDueTime) &&
      !unchangedLegacyTime
    ) {
      setSubmitError("Use a 24-hour time like 09:30.");
      return;
    }
    if (!title.trim() || !submissionGuard.begin()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    Keyboard.dismiss();

    // Calculate dueDate from selection
    let dueDate: string | undefined;
    if (selectedDate === "today") {
      dueDate = toLocalDateKey();
    } else if (selectedDate === "tomorrow") {
      dueDate = addLocalDays(toLocalDateKey(), 1);
    } else if (isLocalDateKey(selectedDate)) {
      dueDate = selectedDate;
    } else if (mode === "edit" && selectedDate === initialTask?.dueDate) {
      dueDate = initialTask.dueDate;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: notes.trim() || undefined,
        priority,
        energyRequired,
        recurrence,
        dueDate,
        dueTime: normalizedDueTime || undefined,
      });
      onClose();
    } catch {
      setSubmitError("This task wasn't saved. Please try again.");
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

  const isValid = title.trim().length > 0;
  const titleText = mode === "edit" ? "Edit task" : "Add a small step";
  const subtitleText =
    mode === "edit" ? "Make it work for you" : "Every big journey starts small";
  const submitText = mode === "edit" ? "Save changes" : "Add task";

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
          accessibilityLabel="Close task form"
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
                        color={Colors.textSecondary}
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
                        autoFocus={mode === "create"}
                        returnKeyType="next"
                        accessibilityLabel="Task title input"
                      />
                    </View>

                    {/* Due Date Selection */}
                    <View style={styles.inputGroup}>
                      <Text
                        variant="label"
                        color={Colors.textSecondary}
                        style={styles.label}
                      >
                        When?
                      </Text>
                      <View style={styles.dateContainer}>
                        {dateOptions.map((option) => (
                          <TouchableOpacity
                            key={option.key}
                            onPress={() => setSelectedDate(option.key)}
                            activeOpacity={0.7}
                            accessibilityLabel={`Set due date: ${option.label}`}
                            accessibilityRole="button"
                            accessibilityState={{
                              selected: selectedDate === option.key,
                            }}
                          >
                            <View
                              style={[
                                styles.dateChip,
                                selectedDate === option.key && {
                                  backgroundColor: Colors.purple + "20",
                                  borderColor: Colors.purple,
                                  borderWidth: 1,
                                },
                              ]}
                            >
                              <Calendar
                                size={14}
                                color={
                                  selectedDate === option.key
                                    ? Colors.purple
                                    : Colors.textTertiary
                                }
                              />
                              <Text
                                variant="small"
                                color={
                                  selectedDate === option.key
                                    ? Colors.purple
                                    : Colors.textSecondary
                                }
                              >
                                {option.label}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Due Time (Optional) */}
                    {selectedDate !== "none" && (
                      <View style={styles.inputGroup}>
                        <Input
                          label="Time (optional)"
                          placeholder="e.g., 2:30 PM"
                          value={dueTime}
                          onChangeText={setDueTime}
                          leftIcon={
                            <Clock size={18} color={Colors.textTertiary} />
                          }
                          accessibilityLabel="Due time input"
                        />
                      </View>
                    )}

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

                    <View style={styles.inputGroup}>
                      <EnergyPicker
                        value={energyRequired}
                        onChange={setEnergyRequired}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <RecurringTaskPicker
                        value={recurrence}
                        onChange={setRecurrence}
                      />
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
                  {submitError && (
                    <Text
                      variant="small"
                      color={Colors.danger}
                      style={styles.submitError}
                      accessibilityRole="alert"
                    >
                      {submitError}
                    </Text>
                  )}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      onPress={handleClose}
                      style={styles.cancelButton}
                      activeOpacity={0.7}
                      accessibilityLabel={
                        mode === "edit"
                          ? "Cancel editing"
                          : "Cancel adding task"
                      }
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
                      accessibilityLabel={submitText}
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
                        {mode === "edit" ? (
                          <Check size={20} color={Colors.textInverse} />
                        ) : (
                          <Plus size={20} color={Colors.textInverse} />
                        )}
                        <Text
                          variant="body"
                          color={Colors.textInverse}
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

const styles = StyleSheet.create({
  modalRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    zIndex: 1,
  },
  keyboardView: {
    ...StyleSheet.absoluteFillObject,
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
    backgroundColor: Colors.card,
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
  dateContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.lavender,
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
});
