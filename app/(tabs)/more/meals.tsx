import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Text } from "@/src/components/ui/Text";
import { MealFormSheet } from "@/src/features/meals/components/MealFormSheet";
import { mealHistory, mealsForDate, nutritionTotals } from "@/src/features/meals/services/mealSelectors";
import { useMealStore } from "@/src/features/meals/store/useMealStore";
import type { MealEntry, MealEntryInput } from "@/src/features/meals/types/meal";
import { MoreScreenHeader } from "@/src/features/more/components";
import { useLocalDay } from "@/src/hooks/useLocalDay";
import { Colors, Radius, Spacing } from "@/src/theme/tokens";
import { formatLocalDate } from "@/src/utils/dateTime";
import { Pencil, Plus, Trash2, Utensils } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from "react-native";

export default function MealsScreen() {
  const store = useMealStore(); const today = useLocalDay(); const [editing, setEditing] = useState<MealEntry | null>(null); const [visible, setVisible] = useState(false); const [saving, setSaving] = useState(false);
  useEffect(() => { if (!store.isHydrated && !store.isLoading) void store.hydrate().catch(() => undefined); }, [store.isHydrated, store.isLoading, store.hydrate]);
  const todayMeals = useMemo(() => mealsForDate(store.meals, today), [store.meals, today]); const totals = useMemo(() => nutritionTotals(todayMeals), [todayMeals]); const history = useMemo(() => mealHistory(store.meals), [store.meals]);
  const save = async (input: MealEntryInput) => { setSaving(true); try { if (editing) await store.updateMeal(editing.id, input); else await store.createMeal(input); setVisible(false); setEditing(null); } catch {} finally { setSaving(false); } };
  const confirmDelete = (meal: MealEntry) => Alert.alert("Delete consumed meal?", `Remove ${meal.name} from your history and totals?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => void store.deleteMeal(meal.id).catch(() => undefined) }]);
  if (!store.isHydrated || store.isLoading) return <Screen padded centered style={styles.center}><ActivityIndicator color={Colors.primary} accessibilityLabel="Loading meal history" /><Text variant="body" color={Colors.textSecondary}>Loading your meals…</Text></Screen>;
  if (store.error && store.meals.length === 0) return <Screen padded centered style={styles.center}><Text variant="heading">Meal history unavailable</Text><Text variant="body" color={Colors.textSecondary} textAlign="center">{store.error}</Text><Button onPress={() => void store.hydrate().catch(() => undefined)}>Try again</Button></Screen>;
  return <Screen scrollable padded><MoreScreenHeader title="My Meals" subtitle="Food you actually consumed" />
    <Card variant="gradient" style={styles.summary}><Text variant="caption" color={Colors.textInverse}>Known nutrition today</Text><Text variant="heading" color={Colors.textInverse}>{totals.calories} kcal</Text><Text variant="small" color={Colors.textInverse}>{todayMeals.length} {todayMeals.length === 1 ? "entry" : "entries"} · only manually entered values are totaled</Text></Card>
    {store.error && <Card style={styles.error} accessibilityRole="alert"><Text variant="body" color={Colors.danger}>{store.error}</Text><Button variant="ghost" size="sm" onPress={store.clearError}>Dismiss</Button></Card>}
    <SectionHeader title="Consumed meal history" actionLabel="Log meal" onAction={() => { setEditing(null); setVisible(true); }} />
    {history.length === 0 ? <EmptyState icon={<Utensils size={36} color={Colors.primary} />} title="No consumed meals yet" description="Log what you ate. Nutrition is optional and never guessed." actionLabel="Log consumed meal" onAction={() => setVisible(true)} /> : <View style={styles.list}>{history.map((meal) => <Card key={meal.id} variant="elevated" style={styles.mealCard}><View style={styles.icon}><Utensils size={20} color={Colors.pink} /></View><View style={styles.info}><Text variant="body" style={styles.name}>{meal.name}</Text><Text variant="caption" color={Colors.textSecondary}>{meal.mealType[0].toUpperCase() + meal.mealType.slice(1)} · {formatLocalDate(meal.date, { month: "short", day: "numeric", year: "numeric" })}</Text>{meal.description && <Text variant="small" color={Colors.textTertiary}>{meal.description}</Text>}<Text variant="small" color={Colors.textTertiary}>{meal.nutrition?.calories !== undefined ? `${meal.nutrition.calories} kcal` : "Nutrition not entered"}</Text></View><TouchableOpacity style={styles.action} onPress={() => { setEditing(meal); setVisible(true); }} accessibilityRole="button" accessibilityLabel={`Edit ${meal.name}`}><Pencil size={18} color={Colors.textSecondary} /></TouchableOpacity><TouchableOpacity style={styles.action} onPress={() => confirmDelete(meal)} accessibilityRole="button" accessibilityLabel={`Delete ${meal.name}`}><Trash2 size={18} color={Colors.danger} /></TouchableOpacity></Card>)}</View>}
    <Button onPress={() => { setEditing(null); setVisible(true); }} leftIcon={<Plus size={20} color={Colors.textInverse} />} style={styles.add}>Log consumed meal</Button>
    <MealFormSheet visible={visible} meal={editing} saving={saving} onClose={() => setVisible(false)} onSave={save} />
  </Screen>;
}
const styles = StyleSheet.create({ center: { gap: Spacing.lg, justifyContent: "center", alignItems: "center" }, summary: { gap: Spacing.sm, padding: Spacing.xl, marginBottom: Spacing.lg }, error: { gap: Spacing.sm, borderColor: Colors.danger, borderWidth: 1, marginBottom: Spacing.lg }, list: { gap: Spacing.md }, mealCard: { padding: Spacing.md, flexDirection: "row", alignItems: "center", gap: Spacing.sm }, icon: { width: 44, height: 44, borderRadius: Radius.lg, backgroundColor: `${Colors.pink}15`, alignItems: "center", justifyContent: "center" }, info: { flex: 1, gap: 2 }, name: { fontWeight: "500" }, action: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, add: { marginTop: Spacing.xl } });
