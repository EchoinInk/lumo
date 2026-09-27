import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Text } from "@/src/components/ui/Text";
import { useBrainDump } from "@/src/features/brain-dump";
import { useReminders } from "@/src/features/reminders";
import { useTasks } from "@/src/features/tasks";
import { Colors, Radius, Spacing } from "@/src/theme/tokens";
import { Bell, CheckSquare, Cloud } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export type QuickCaptureTarget = "task" | "brain_dump" | "reminder";

interface QuickCaptureSheetProps {
  visible: boolean;
  onClose: () => void;
  defaultTarget?: QuickCaptureTarget;
}

const targets: {
  value: QuickCaptureTarget;
  label: string;
  icon: typeof CheckSquare;
}[] = [
  { value: "task", label: "Task", icon: CheckSquare },
  { value: "brain_dump", label: "Brain dump", icon: Cloud },
  { value: "reminder", label: "Reminder", icon: Bell },
];

export function QuickCaptureSheet({
  visible,
  onClose,
  defaultTarget = "task",
}: QuickCaptureSheetProps) {
  const [target, setTarget] = useState<QuickCaptureTarget>(defaultTarget);
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { createTask } = useTasks();
  const brainDump = useBrainDump();
  const reminders = useReminders();

  useEffect(() => {
    if (!visible) {
      setText("");
      setTarget(defaultTarget);
      setIsSaving(false);
      setSaveError(null);
    }
  }, [visible, defaultTarget]);

  const handleSave = async () => {
    const value = text.trim();
    if (!value || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      if (target === "task") {
        await createTask({ title: value, priority: "medium" });
      } else if (target === "reminder") {
        await Promise.resolve(
          reminders.addReminder({ title: value, tone: reminders.settings.tone }),
        );
      } else {
        await Promise.resolve(brainDump.addEntry({ text: value }));
      }

      setText("");
      setTarget(defaultTarget);
      onClose();
    } catch {
      setSaveError("This item wasn't saved. Your text is still here to retry.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text variant="subheading">Quick capture</Text>
        <Text variant="body" color={Colors.textSecondary}>
          Capture first. Organize later.
        </Text>

        <View style={styles.targetRow}>
          {targets.map((option) => {
            const Icon = option.icon;
            const isSelected = option.value === target;

            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.targetPill, isSelected && styles.targetPillSelected]}
                onPress={() => setTarget(option.value)}
                accessibilityRole="button"
                accessibilityLabel={`Capture as ${option.label}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Icon
                  size={16}
                  color={isSelected ? Colors.textInverse : Colors.textSecondary}
                />
                <Text
                  variant="caption"
                  color={isSelected ? Colors.textInverse : Colors.textSecondary}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          value={text}
          onChangeText={setText}
          placeholder="What is on your mind?"
          accessibilityLabel="Quick capture text"
          multiline
          helperText="No category needed right now."
        />

        {saveError && (
          <Text
            variant="small"
            color={Colors.danger}
            accessibilityRole="alert"
          >
            {saveError}
          </Text>
        )}

        <View style={styles.actions}>
        <Button
          variant="ghost"
          onPress={onClose}
          accessibilityLabel="Close quick capture"
        >
          Cancel
        </Button>
          <Button
            onPress={handleSave}
            disabled={!text.trim() || isSaving}
            loading={isSaving}
            accessibilityHint="Saves this item locally"
          >
            Capture
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  targetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  targetPill: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
  },
  targetPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
  },
});
