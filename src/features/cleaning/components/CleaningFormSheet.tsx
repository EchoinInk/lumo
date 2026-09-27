import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import type { RecurrencePattern } from "@/features/tasks/types/recurrence";
import { Colors, Radius, Spacing } from "@/theme/tokens";
import { isLocalDateKey, toLocalDateKey } from "@/utils/dateTime";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import type { CleaningItem, CleaningItemInput } from "../types/cleaning";

type RepeatType = RecurrencePattern["type"];

interface Props {
  visible: boolean;
  item?: CleaningItem | null;
  saving: boolean;
  onClose: () => void;
  onSave: (input: CleaningItemInput) => Promise<void>;
}

const repeatOptions: { value: RepeatType; label: string }[] = [
  { value: "none", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function CleaningFormSheet({ visible, item, saving, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState<string>(toLocalDateKey());
  const [repeat, setRepeat] = useState<RepeatType>("weekly");
  const [errors, setErrors] = useState<{ name?: string; startDate?: string }>({});

  useEffect(() => {
    if (!visible) return;
    setName(item?.name ?? "");
    setNotes(item?.notes ?? "");
    setStartDate(item?.startDate ?? toLocalDateKey());
    setRepeat(item?.recurrence.type ?? "weekly");
    setErrors({});
  }, [visible, item]);

  const submit = async () => {
    const nextErrors = {
      name: name.trim() ? undefined : "Enter a name.",
      startDate: isLocalDateKey(startDate) ? undefined : "Use a valid YYYY-MM-DD date.",
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.startDate) return;
    await onSave({
      name: name.trim(),
      notes: notes.trim() || undefined,
      startDate,
      recurrence: repeat === "weekly"
        ? { type: "weekly" }
        : repeat === "daily"
          ? { type: "daily" }
          : repeat === "monthly"
            ? { type: "monthly" }
            : { type: "none" },
    });
  };

  return (
    <BottomSheet visible={visible} onClose={saving ? undefined : onClose} style={styles.sheet}>
      <Text variant="heading" style={styles.title}>{item ? "Edit cleaning item" : "Add cleaning item"}</Text>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
        <Input label="Name" value={name} onChangeText={setName} error={errors.name} placeholder="What needs cleaning?" autoFocus />
        <Input label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Room, supplies, or a gentle reminder" multiline />
        <Input label="First date" value={startDate} onChangeText={setStartDate} error={errors.startDate} helperText="YYYY-MM-DD" autoCapitalize="none" />
        <View>
          <Text variant="label" color={Colors.textSecondary} style={styles.label}>Repeat</Text>
          <View style={styles.options}>
            {repeatOptions.map((option) => {
              const selected = repeat === option.value;
              return (
                <TouchableOpacity key={option.value} onPress={() => setRepeat(option.value)} style={[styles.option, selected && styles.optionSelected]} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`Repeat ${option.label.toLowerCase()}`}>
                  <Text variant="small" color={selected ? Colors.textInverse : Colors.textPrimary}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.actions}>
          <Button variant="ghost" onPress={onClose} disabled={saving} style={styles.action}>Cancel</Button>
          <Button onPress={() => void submit()} loading={saving} style={styles.action}>{item ? "Save changes" : "Add item"}</Button>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { maxHeight: "86%" },
  title: { marginBottom: Spacing.md },
  form: { gap: Spacing.lg, paddingBottom: Spacing.sm },
  label: { marginBottom: Spacing.sm },
  options: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  option: { minHeight: 44, paddingHorizontal: Spacing.md, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full },
  optionSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  actions: { flexDirection: "row", gap: Spacing.sm },
  action: { flex: 1 },
});
