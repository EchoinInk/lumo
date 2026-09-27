import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { Colors, Radius, Spacing } from "@/theme/tokens";
import { isLocalDateKey, toLocalDateKey } from "@/utils/dateTime";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { mealTypes, type MealEntry, type MealEntryInput, type MealNutrition, type MealType } from "../types/meal";

interface Props { visible: boolean; meal?: MealEntry | null; saving: boolean; onClose: () => void; onSave: (input: MealEntryInput) => Promise<void>; }
const labels: Record<MealType, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

export function MealFormSheet({ visible, meal, saving, onClose, onSave }: Props) {
  const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [date, setDate] = useState<string>(toLocalDateKey()); const [mealType, setMealType] = useState<MealType>("breakfast");
  const [nutrition, setNutrition] = useState<Record<keyof MealNutrition, string>>({ calories: "", proteinGrams: "", carbohydrateGrams: "", fatGrams: "" });
  const [error, setError] = useState<string | undefined>();
  useEffect(() => { if (!visible) return; setName(meal?.name ?? ""); setDescription(meal?.description ?? ""); setDate(meal?.date ?? toLocalDateKey()); setMealType(meal?.mealType ?? "breakfast"); setNutrition({ calories: meal?.nutrition?.calories?.toString() ?? "", proteinGrams: meal?.nutrition?.proteinGrams?.toString() ?? "", carbohydrateGrams: meal?.nutrition?.carbohydrateGrams?.toString() ?? "", fatGrams: meal?.nutrition?.fatGrams?.toString() ?? "" }); setError(undefined); }, [visible, meal]);
  const submit = async () => {
    if (!name.trim() || !isLocalDateKey(date)) { setError(!name.trim() ? "Enter a meal name." : "Use a valid YYYY-MM-DD date."); return; }
    const parsed: MealNutrition = {};
    for (const field of Object.keys(nutrition) as (keyof MealNutrition)[]) { if (nutrition[field].trim()) { const value = Number(nutrition[field]); if (!Number.isFinite(value) || value < 0) { setError("Nutrition values must be zero or greater."); return; } parsed[field] = value; } }
    await onSave({ name: name.trim(), description: description.trim() || undefined, date, mealType, nutrition: Object.keys(parsed).length ? parsed : undefined });
  };
  return <BottomSheet visible={visible} onClose={saving ? undefined : onClose} style={styles.sheet}><Text variant="heading" style={styles.title}>{meal ? "Edit consumed meal" : "Log consumed meal"}</Text><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
    <Input label="Meal name" value={name} onChangeText={setName} placeholder="What did you eat?" autoFocus />
    <Input label="Description (optional)" value={description} onChangeText={setDescription} placeholder="Details you want to remember" multiline />
    <Input label="Date consumed" value={date} onChangeText={setDate} helperText="YYYY-MM-DD" autoCapitalize="none" />
    <View><Text variant="label" color={Colors.textSecondary} style={styles.label}>Meal type</Text><View style={styles.options}>{mealTypes.map((type) => <TouchableOpacity key={type} onPress={() => setMealType(type)} style={[styles.option, mealType === type && styles.selected]} accessibilityRole="radio" accessibilityState={{ selected: mealType === type }} accessibilityLabel={labels[type]}><Text variant="small" color={mealType === type ? Colors.textInverse : Colors.textPrimary}>{labels[type]}</Text></TouchableOpacity>)}</View></View>
    <Text variant="label" color={Colors.textSecondary}>Optional manually entered nutrition</Text>
    <View style={styles.nutrition}><Input label="Calories" value={nutrition.calories} onChangeText={(value) => setNutrition((state) => ({ ...state, calories: value }))} keyboardType="decimal-pad" /><Input label="Protein (g)" value={nutrition.proteinGrams} onChangeText={(value) => setNutrition((state) => ({ ...state, proteinGrams: value }))} keyboardType="decimal-pad" /><Input label="Carbs (g)" value={nutrition.carbohydrateGrams} onChangeText={(value) => setNutrition((state) => ({ ...state, carbohydrateGrams: value }))} keyboardType="decimal-pad" /><Input label="Fat (g)" value={nutrition.fatGrams} onChangeText={(value) => setNutrition((state) => ({ ...state, fatGrams: value }))} keyboardType="decimal-pad" /></View>
    {error && <Text variant="small" color={Colors.danger} accessibilityRole="alert">{error}</Text>}
    <View style={styles.actions}><Button variant="ghost" onPress={onClose} disabled={saving} style={styles.action}>Cancel</Button><Button onPress={() => void submit()} loading={saving} style={styles.action}>{meal ? "Save changes" : "Log meal"}</Button></View>
  </ScrollView></BottomSheet>;
}
const styles = StyleSheet.create({ sheet: { maxHeight: "92%" }, title: { marginBottom: Spacing.md }, form: { gap: Spacing.lg, paddingBottom: Spacing.md }, label: { marginBottom: Spacing.sm }, options: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm }, option: { minHeight: 44, paddingHorizontal: Spacing.md, justifyContent: "center", borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full }, selected: { backgroundColor: Colors.primary, borderColor: Colors.primary }, nutrition: { gap: Spacing.md }, actions: { flexDirection: "row", gap: Spacing.sm }, action: { flex: 1 } });
