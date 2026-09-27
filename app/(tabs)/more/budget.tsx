import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useBudgetCategoryStore } from "@/features/budget/store/useBudgetCategoryStore";
import { parseNzdAmountToMinor } from "@/features/budget/services/budgetMoney";
import type { BudgetCategory } from "@/features/budget/types/budgetCategory";
import { MoreScreenHeader } from "@/features/more/components";
import { Colors, Spacing } from "@/theme/tokens";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from "react-native";

const money = new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" });

export default function BudgetScreen() {
  const store = useBudgetCategoryStore();
  const { hydrate, isHydrated, isLoading } = store;
  const [editing, setEditing] = useState<BudgetCategory | null>(null);
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  useEffect(() => { if (!isHydrated && !isLoading) void hydrate().catch(() => undefined); }, [hydrate, isHydrated, isLoading]);
  const open = (category?: BudgetCategory) => { setEditing(category ?? null); setName(category?.name ?? ""); setAmount(category ? (category.plannedAmountMinor / 100).toFixed(2) : ""); setFormError(null); setVisible(true); };
  const submit = async () => {
    const minor = parseNzdAmountToMinor(amount);
    if (!name.trim() || minor === null) { setFormError("Enter a category name and a positive amount with no more than two decimal places."); return; }
    if (submitting.current) return; submitting.current = true; setSaving(true);
    try { if (editing) await store.updateCategory(editing.id, { name, plannedAmountMinor: minor }); else await store.createCategory({ name, plannedAmountMinor: minor }); setVisible(false); }
    catch { setFormError("Could not save this category. Please try again."); }
    finally { submitting.current = false; setSaving(false); }
  };
  if (!store.isHydrated || store.isLoading) return <Screen padded centered><ActivityIndicator color={Colors.primary}/><Text>Loading budget…</Text></Screen>;
  const total = store.categories.reduce((sum, category) => sum + category.plannedAmountMinor, 0);
  return <Screen scrollable padded><MoreScreenHeader title="Budget" subtitle="Monthly plan · NZD"/>
    <Card variant="gradient" style={styles.summary}><Text color={Colors.textInverse} variant="caption">Total planned this month</Text><Text color={Colors.textInverse} variant="heading">{money.format(total / 100)}</Text><Text color={Colors.textInverse} variant="small">Actual spending begins when expense tracking is implemented.</Text></Card>
    {store.error && <Card style={styles.error}><Text color={Colors.danger} accessibilityRole="alert">{store.error}</Text><Button variant="ghost" size="sm" onPress={store.clearError}>Dismiss</Button></Card>}
    {store.categories.length === 0 ? <EmptyState icon={<Wallet size={36} color={Colors.primary}/>} title="No budget categories" description="Add monthly planned spending without inventing actual totals." actionLabel="Add category" onAction={() => open()}/> : <View style={styles.list}>{store.categories.map((category) => <Card key={category.id} style={styles.row}><View style={styles.info}><Text>{category.name}</Text><Text variant="caption" color={Colors.textSecondary}>{money.format(category.plannedAmountMinor / 100)} planned monthly</Text></View><TouchableOpacity style={styles.action} onPress={() => open(category)} accessibilityLabel={`Edit ${category.name}`}><Pencil size={18}/></TouchableOpacity><TouchableOpacity style={styles.action} accessibilityLabel={`Delete ${category.name}`} onPress={() => Alert.alert("Delete category?", "Future expense history will retain its own category snapshot.", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => void store.deleteCategory(category.id).catch(() => undefined) }])}><Trash2 size={18} color={Colors.danger}/></TouchableOpacity></Card>)}</View>}
    <Button style={styles.add} leftIcon={<Plus size={18} color={Colors.textInverse}/>} onPress={() => open()}>Add category</Button>
    <BottomSheet visible={visible} onClose={saving ? undefined : () => setVisible(false)}><Text variant="heading">{editing ? "Edit budget category" : "New budget category"}</Text><View style={styles.form}><Input label="Category name" value={name} onChangeText={setName} autoFocus/><Input label="Monthly planned amount (NZD)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00"/>{formError && <Text color={Colors.danger} accessibilityRole="alert">{formError}</Text>}<View style={styles.buttons}><Button style={styles.button} variant="ghost" disabled={saving} onPress={() => setVisible(false)}>Cancel</Button><Button style={styles.button} loading={saving} onPress={() => void submit()}>{editing ? "Save changes" : "Save category"}</Button></View></View></BottomSheet>
  </Screen>;
}

const styles = StyleSheet.create({ summary: { padding: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.lg }, error: { gap: Spacing.sm, borderColor: Colors.danger, borderWidth: 1, marginBottom: Spacing.md }, list: { gap: Spacing.md }, row: { padding: Spacing.md, flexDirection: "row", alignItems: "center" }, info: { flex: 1, gap: Spacing.xs }, action: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, add: { marginTop: Spacing.xl }, form: { gap: Spacing.md, marginTop: Spacing.lg }, buttons: { flexDirection: "row", gap: Spacing.sm }, button: { flex: 1 } });
