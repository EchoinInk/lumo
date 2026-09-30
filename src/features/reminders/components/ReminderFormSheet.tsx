import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Text } from "@/src/components/ui/Text";
import { Colors, Radius, Spacing } from "@/src/theme/tokens";
import { isLocalDateKey, isWallClockTime, localDateKeyToDate, toLocalDateKey } from "@/src/utils/dateTime";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import type { Reminder, ReminderTone, UpdateReminderInput } from "../types/reminder";

interface Props { visible: boolean; reminder?: Reminder | null; saving: boolean; onClose: () => void; onSave: (input: UpdateReminderInput) => Promise<void> }
const tones: ReminderTone[] = ["gentle", "practical", "encouraging"];

export function ReminderFormSheet({ visible, reminder, saving, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [tone, setTone] = useState<ReminderTone>("gentle");
  const [errors, setErrors] = useState<{ title?: string; schedule?: string }>({});

  useEffect(() => {
    if (!visible) return;
    const scheduled = reminder?.scheduledAt ? new Date(reminder.scheduledAt) : null;
    setTitle(reminder?.title ?? "");
    setDate(scheduled ? toLocalDateKey(scheduled) : "");
    setTime(scheduled ? `${String(scheduled.getHours()).padStart(2, "0")}:${String(scheduled.getMinutes()).padStart(2, "0")}` : "");
    setEnabled(reminder?.enabled ?? true);
    setTone(reminder?.tone ?? "gentle");
    setErrors({});
  }, [reminder, visible]);

  const submit = async () => {
    const schedulePartial = Boolean(date) !== Boolean(time);
    const scheduleInvalid = Boolean(date && time) && (!isLocalDateKey(date) || !isWallClockTime(time));
    const scheduledDate = date && time && !scheduleInvalid ? localDateKeyToDate(date, time) : null;
    const schedulePast = Boolean(scheduledDate && scheduledDate.getTime() <= Date.now() && scheduledDate.toISOString() !== reminder?.scheduledAt);
    const nextErrors = {
      title: title.trim() ? undefined : "Enter a reminder title.",
      schedule: schedulePartial ? "Enter both a date and time, or leave both empty." : scheduleInvalid ? "Use a valid YYYY-MM-DD date and HH:mm time." : schedulePast ? "Choose a time in the future." : undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.schedule) return;
    await onSave({ title: title.trim(), scheduledAt: scheduledDate?.toISOString(), enabled, tone });
  };

  return (
    <BottomSheet visible={visible} onClose={saving ? undefined : onClose} style={styles.sheet}>
      <Text variant="heading" style={styles.title}>{reminder ? "Edit reminder" : "Add reminder"}</Text>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
        <Input label="Reminder" value={title} onChangeText={setTitle} error={errors.title} placeholder="What should Lumo remember?" autoFocus />
        <View style={styles.scheduleRow}>
          <Input label="Date (optional)" value={date} onChangeText={setDate} error={errors.schedule} helperText="YYYY-MM-DD" autoCapitalize="none" style={styles.input} />
          <Input label="Time (optional)" value={time} onChangeText={setTime} helperText="HH:mm" autoCapitalize="none" style={styles.input} />
        </View>
        <View>
          <Text variant="label" color={Colors.textSecondary} style={styles.label}>Tone</Text>
          <View style={styles.options}>{tones.map((value) => <TouchableOpacity key={value} onPress={() => setTone(value)} style={[styles.option, tone === value && styles.optionSelected]} accessibilityRole="radio" accessibilityState={{ selected: tone === value }}><Text variant="small" color={tone === value ? Colors.textInverse : Colors.textPrimary}>{value[0].toUpperCase() + value.slice(1)}</Text></TouchableOpacity>)}</View>
        </View>
        <Button variant={enabled ? "secondary" : "ghost"} onPress={() => setEnabled((value) => !value)} accessibilityRole="switch" accessibilityState={{ checked: enabled }}>{enabled ? "Reminder enabled" : "Reminder disabled"}</Button>
        <Text variant="small" color={Colors.textTertiary}>Saving a time records when you want a reminder. Native delivery is only confirmed after the operating system accepts it.</Text>
        <View style={styles.actions}><Button variant="ghost" onPress={onClose} disabled={saving} style={styles.action}>Cancel</Button><Button onPress={() => void submit()} loading={saving} style={styles.action}>{reminder ? "Save changes" : "Add reminder"}</Button></View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { maxHeight: "90%" }, title: { marginBottom: Spacing.md }, form: { gap: Spacing.lg, paddingBottom: Spacing.sm },
  scheduleRow: { flexDirection: "row", gap: Spacing.sm }, input: { minWidth: 0 }, label: { marginBottom: Spacing.sm },
  options: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm }, option: { minHeight: 44, paddingHorizontal: Spacing.md, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full }, optionSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  actions: { flexDirection: "row", gap: Spacing.sm }, action: { flex: 1 },
});
