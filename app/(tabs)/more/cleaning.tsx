import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ProgressBar } from "@/src/components/ui/ProgressBar";
import { Screen } from "@/src/components/ui/Screen";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Text } from "@/src/components/ui/Text";
import { CleaningFormSheet } from "@/src/features/cleaning/components/CleaningFormSheet";
import { useCleaning } from "@/src/features/cleaning/hooks/useCleaning";
import type { CleaningItem, CleaningItemInput } from "@/src/features/cleaning/types/cleaning";
import { summarizeRecurrence } from "@/src/features/tasks/utils/recurrence";
import { MoreScreenHeader } from "@/src/features/more/components";
import { Colors, Radius, Spacing } from "@/src/theme/tokens";
import { formatLocalDate } from "@/src/utils/dateTime";
import { Check, Circle, Pencil, Plus, Sparkles, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from "react-native";

export default function CleaningScreen() {
  const cleaning = useCleaning();
  const [editing, setEditing] = useState<CleaningItem | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditing(null); setFormVisible(true); };
  const save = async (input: CleaningItemInput) => {
    setSaving(true);
    try {
      if (editing) await cleaning.updateItem(editing.id, input);
      else await cleaning.createItem(input);
      setFormVisible(false);
      setEditing(null);
    } catch {
      // The store exposes the actionable save message inline.
    } finally { setSaving(false); }
  };

  const confirmDelete = (item: CleaningItem) => Alert.alert(
    "Delete cleaning item?",
    `This removes ${item.name} from your schedule.`,
    [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void cleaning.deleteItem(item.id).catch(() => undefined) },
    ],
  );

  if (!cleaning.isHydrated || cleaning.isLoading) {
    return <Screen padded centered style={styles.center}><ActivityIndicator color={Colors.primary} accessibilityLabel="Loading cleaning schedule" /><Text variant="body" color={Colors.textSecondary}>Loading your cleaning schedule…</Text></Screen>;
  }

  if (cleaning.error && cleaning.items.length === 0) {
    return (
      <Screen padded centered style={styles.center}>
        <Text variant="heading">Cleaning schedule unavailable</Text>
        <Text variant="body" color={Colors.textSecondary} textAlign="center">{cleaning.error}</Text>
        <Button onPress={() => void cleaning.hydrate().catch(() => undefined)}>Try again</Button>
      </Screen>
    );
  }

  return (
    <Screen scrollable padded>
      <MoreScreenHeader title="Cleaning Schedule" subtitle="Your local routines" />
      <Card variant="gradient" style={styles.progressCard}>
        <Text variant="caption" color={Colors.textInverse}>Completed this week</Text>
        <Text variant="heading" color={Colors.textInverse}>{cleaning.completedCount} / {cleaning.occurrenceCount}</Text>
        <ProgressBar progress={cleaning.progress} height={8} variant="default" />
      </Card>

      {cleaning.error && (
        <Card style={styles.errorCard} accessibilityRole="alert">
          <Text variant="body" color={Colors.danger}>{cleaning.error}</Text>
          <Button variant="ghost" size="sm" onPress={cleaning.clearError}>Dismiss</Button>
        </Card>
      )}

      <SectionHeader title="Your cleaning" actionLabel="Add item" onAction={openCreate} />
      {cleaning.items.length === 0 ? (
        <EmptyState icon={<Sparkles size={36} color={Colors.primary} />} title="No cleaning items yet" description="Add only the things you want Lumo to help you remember." actionLabel="Add cleaning item" onAction={openCreate} />
      ) : (
        <View style={styles.list}>
          {cleaning.items.map((item) => {
            const date = cleaning.actionableDate(item.id);
            const completed = Boolean(date && item.completedDates.includes(date));
            return (
              <Card key={item.id} variant="elevated" style={styles.itemCard}>
                <TouchableOpacity
                  style={styles.itemMain}
                  disabled={!date}
                  onPress={() => date && void cleaning.setCompletion(item.id, date, !completed).catch(() => undefined)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: completed, disabled: !date }}
                  accessibilityLabel={`${item.name}${date ? `, scheduled ${date}` : ", not yet due"}`}
                  accessibilityHint={completed ? "Double tap to undo completion" : "Double tap to mark complete"}
                >
                  <View style={[styles.checkbox, completed && styles.checkboxChecked]}>
                    {completed ? <Check size={20} color={Colors.textInverse} /> : <Circle size={20} color={Colors.primary} />}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text variant="body" style={completed && styles.completedName}>{item.name}</Text>
                    <Text variant="caption" color={Colors.textSecondary}>{summarizeRecurrence(item.recurrence)} · starts {formatLocalDate(item.startDate, { month: "short", day: "numeric", year: "numeric" })}</Text>
                    {date && <Text variant="small" color={Colors.textTertiary}>{completed ? "Completed" : date < cleaning.today ? "Overdue" : "Due"} {formatLocalDate(date, { weekday: "short", month: "short", day: "numeric" })}</Text>}
                    {item.notes && <Text variant="small" color={Colors.textTertiary}>{item.notes}</Text>}
                  </View>
                </TouchableOpacity>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => { setEditing(item); setFormVisible(true); }} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={`Edit ${item.name}`}><Pencil size={18} color={Colors.textSecondary} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={`Delete ${item.name}`}><Trash2 size={18} color={Colors.danger} /></TouchableOpacity>
                </View>
              </Card>
            );
          })}
        </View>
      )}
      <Button onPress={openCreate} leftIcon={<Plus size={20} color={Colors.textInverse} />} style={styles.addButton}>Add cleaning item</Button>
      <CleaningFormSheet visible={formVisible} item={editing} saving={saving} onClose={() => setFormVisible(false)} onSave={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { gap: Spacing.lg, justifyContent: "center", alignItems: "center" },
  progressCard: { gap: Spacing.sm, padding: Spacing.xl, marginBottom: Spacing.lg },
  errorCard: { gap: Spacing.sm, marginBottom: Spacing.lg, borderColor: Colors.danger, borderWidth: 1 },
  list: { gap: Spacing.md },
  itemCard: { padding: Spacing.md, flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  itemMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: Spacing.md, minHeight: 44 },
  checkbox: { width: 32, height: 32, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: Colors.success, borderColor: Colors.success },
  itemInfo: { flex: 1, gap: 2 },
  completedName: { textDecorationLine: "line-through", color: Colors.textTertiary },
  actions: { flexDirection: "row" },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  addButton: { marginTop: Spacing.xl },
});
