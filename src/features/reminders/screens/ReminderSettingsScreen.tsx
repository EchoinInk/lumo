import { Screen } from "@/src/components/ui/Screen";
import { ScreenBackButton } from "@/src/components/ui/ScreenBackButton";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { ReminderSettingsCard } from "../components/ReminderSettingsCard";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Text } from "@/src/components/ui/Text";
import { Colors, Spacing } from "@/src/theme/tokens";
import { Bell } from "lucide-react-native";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { ReminderFormSheet } from "../components/ReminderFormSheet";
import { useReminders } from "../hooks/useReminders";
import type { Reminder, UpdateReminderInput } from "../types/reminder";

export default function ReminderSettingsScreen() {
  const reminders = useReminders();
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const active = reminders.reminders.filter((reminder) => !reminder.archivedAt);

  const save = async (input: UpdateReminderInput) => {
    if (editing) await reminders.updateReminder(editing.id, input);
    else await reminders.addReminder(input);
    setFormVisible(false);
    setEditing(null);
  };

  const remove = (reminder: Reminder) => Alert.alert("Delete reminder?", "This removes the reminder and marks any stored OS request for cancellation.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: () => void reminders.deleteReminder(reminder.id) },
  ]);

  return (
    <Screen scrollable padded>
      <ScreenBackButton fallbackPath="/(tabs)/more" />
      <SectionHeader
        title="Reminder Settings"
        subtitle="Customize how reminders feel."
      />
      <ReminderSettingsCard />
      <View style={styles.headingRow}><Text variant="subheading">Your reminders</Text><Button size="sm" onPress={() => { setEditing(null); setFormVisible(true); }}>Add reminder</Button></View>
      {reminders.error && <Text variant="small" color={Colors.danger} accessibilityRole="alert">{reminders.error}</Text>}
      {active.length === 0 ? (
        <EmptyState icon={<Bell size={28} color={Colors.primary} />} title="No reminders yet" description="Create a reminder with an optional future date and time." actionLabel="Add reminder" onAction={() => setFormVisible(true)} />
      ) : active.map((reminder) => (
        <Card key={reminder.id} variant="outlined" style={styles.reminderCard}>
          <View style={styles.headingRow}><View style={styles.copy}><Text variant="body">{reminder.title}</Text><Text variant="caption" color={Colors.textSecondary}>{reminder.scheduledAt ? new Date(reminder.scheduledAt).toLocaleString() : "No delivery time"}</Text><Text variant="small" color={Colors.textTertiary}>{reminder.completedAt ? "Completed" : !reminder.enabled ? "Disabled" : reminder.deliveryState === "scheduled" ? "Scheduled with the operating system" : reminder.deliveryState === "failed" ? "Scheduling failed" : reminder.deliveryState === "cancellation-pending" ? "OS cancellation required" : "Not scheduled with the operating system"}</Text></View></View>
          <View style={styles.actions}>
            <Button size="sm" variant="ghost" onPress={() => void reminders.setCompleted(reminder.id, !reminder.completedAt)}>{reminder.completedAt ? "Reopen" : "Complete"}</Button>
            <Button size="sm" variant="secondary" onPress={() => { setEditing(reminder); setFormVisible(true); }}>Edit</Button>
            <Button size="sm" variant="ghost" onPress={() => remove(reminder)}>Delete</Button>
          </View>
        </Card>
      ))}
      <ReminderFormSheet visible={formVisible} reminder={editing} saving={reminders.isSaving} onClose={() => { setFormVisible(false); setEditing(null); }} onSave={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({ headingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: Spacing.md }, copy: { flex: 1, gap: Spacing.xs }, reminderCard: { gap: Spacing.md }, actions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm } });
