import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { MoreScreenHeader } from "@/features/more/components";
import { formatWeight, gramsToUnit, parseWeightToGrams } from "@/features/weight/services/weightUnits";
import { latestWeight, weightChangeGrams, weightHistory } from "@/features/weight/services/weightSelectors";
import { useWeightStore } from "@/features/weight/store/useWeightStore";
import type { WeightEntry } from "@/features/weight/types/weight";
import { Colors, Radius, Spacing } from "@/theme/tokens";
import { formatLocalDate, toLocalDateKey } from "@/utils/dateTime";
import { Pencil, Plus, Scale, Trash2 } from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from "react-native";

export default function WeightScreen() {
  const store = useWeightStore(); const unit = store.state.preferredUnit; const history = useMemo(() => weightHistory(store.state.entries), [store.state.entries]); const latest = latestWeight(store.state.entries); const change = weightChangeGrams(store.state.entries);
  const [form, setForm] = useState<WeightEntry | "new" | null>(null); const [amount, setAmount] = useState(""); const [date, setDate] = useState(""); const [note, setNote] = useState(""); const [formError, setFormError] = useState<string | null>(null); const submitting = useRef(false);
  const open = (entry?: WeightEntry) => { setForm(entry ?? "new"); setAmount(entry ? gramsToUnit(entry.grams, unit).toFixed(1) : ""); setDate(entry?.date ?? toLocalDateKey()); setNote(entry?.note ?? ""); setFormError(null); };
  const submit = async () => { const grams = parseWeightToGrams(amount, unit); if (grams === null || !date) return setFormError(`Enter a positive weight in ${unit} and a valid date.`); if (submitting.current) return; submitting.current = true; try { const input = { grams, date, note }; if (form !== "new" && form) await store.updateEntry(form.id, input); else await store.createEntry(input); setForm(null); } catch { setFormError("Could not save this weight entry. Please retry."); } finally { submitting.current = false; } };
  if (!store.isHydrated || store.isLoading) return <Screen padded centered><ActivityIndicator color={Colors.primary}/><Text>Loading weight history…</Text></Screen>;
  return <Screen scrollable padded><MoreScreenHeader title="Weight Tracker" subtitle="Your recorded history"/>
    <View style={styles.units}><Text variant="label" color={Colors.textSecondary}>Display unit</Text><Button size="sm" variant={unit === "kg" ? "primary" : "ghost"} onPress={() => void store.setUnit("kg")}>kg</Button><Button size="sm" variant={unit === "lb" ? "primary" : "ghost"} onPress={() => void store.setUnit("lb")}>lb</Button></View>
    {store.error && <Card style={styles.error}><Text color={Colors.danger} accessibilityRole="alert">{store.error}</Text><Button size="sm" variant="ghost" onPress={store.clearError}>Dismiss</Button></Card>}
    {latest ? (
      <Card variant="gradient" style={styles.summary}><Text variant="caption" color={Colors.textInverse}>Latest recorded weight · {latest.date}</Text><Text variant="heading" color={Colors.textInverse}>{formatWeight(latest.grams, unit)}</Text><Text variant="small" color={Colors.textInverse}>{change === null ? "Add another entry to see the change" : `${change > 0 ? "+" : ""}${gramsToUnit(change, unit).toFixed(1)} ${unit} since the previous entry`}</Text></Card>
    ) : (
      <EmptyState icon={<Scale size={36} color={Colors.primary}/>} title="No weight entries" description="Log a dated weight when you choose. Lumo describes changes neutrally." actionLabel="Log weight" onAction={() => open()}/>
    )}
    {history.length > 0 && <View style={styles.list}>{history.map((entry, index) => { const previous = history[index + 1]; const delta = previous ? entry.grams - previous.grams : null; return <Card key={entry.id} style={styles.row}><View style={styles.icon}><Scale size={18} color={Colors.primary}/></View><View style={styles.info}><Text>{formatWeight(entry.grams, unit)}</Text><Text variant="caption" color={Colors.textSecondary}>{formatLocalDate(entry.date, { year: "numeric", month: "short", day: "numeric" })}{entry.note ? ` · ${entry.note}` : ""}</Text><Text variant="small" color={Colors.textTertiary}>{delta === null ? "First recorded entry" : `${delta > 0 ? "+" : ""}${gramsToUnit(delta, unit).toFixed(1)} ${unit} from prior entry`}</Text></View><TouchableOpacity style={styles.action} onPress={() => open(entry)} accessibilityLabel={`Edit weight from ${entry.date}`}><Pencil size={18}/></TouchableOpacity><TouchableOpacity style={styles.action} onPress={() => Alert.alert("Delete weight entry?", "Current weight and change will be recalculated from the remaining records.", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => void store.deleteEntry(entry.id) }])} accessibilityLabel={`Delete weight from ${entry.date}`}><Trash2 size={18} color={Colors.danger}/></TouchableOpacity></Card>; })}</View>}
    <Button style={styles.add} leftIcon={<Plus size={18} color={Colors.textInverse}/>} onPress={() => open()}>Log weight</Button>
    <BottomSheet visible={form !== null} onClose={() => setForm(null)}><Text variant="heading">{form === "new" ? "Log weight" : "Edit weight"}</Text><View style={styles.form}><Input label={`Weight (${unit})`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad"/><Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate}/><Input label="Note (optional)" value={note} onChangeText={setNote}/>{formError && <Text color={Colors.danger} accessibilityRole="alert">{formError}</Text>}<View style={styles.buttons}><Button style={styles.flex} variant="ghost" onPress={() => setForm(null)}>Cancel</Button><Button style={styles.flex} loading={store.isSaving} onPress={() => void submit()}>Save</Button></View></View></BottomSheet>
  </Screen>;
}
const styles = StyleSheet.create({ units: { flexDirection: "row", gap: Spacing.sm, alignItems: "center", marginBottom: Spacing.lg }, error: { gap: Spacing.sm, borderColor: Colors.danger, borderWidth: 1, marginBottom: Spacing.md }, summary: { padding: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.xl }, list: { gap: Spacing.md }, row: { padding: Spacing.md, flexDirection: "row", alignItems: "center", gap: Spacing.sm }, icon: { width: 44, height: 44, borderRadius: Radius.lg, backgroundColor: `${Colors.primary}15`, alignItems: "center", justifyContent: "center" }, info: { flex: 1, gap: Spacing.xs }, action: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, add: { marginTop: Spacing.xl }, form: { gap: Spacing.md, marginTop: Spacing.lg }, buttons: { flexDirection: "row", gap: Spacing.sm }, flex: { flex: 1 } });
