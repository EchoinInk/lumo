import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { ProgressBar } from "@/src/components/ui/ProgressBar";
import { Text } from "@/src/components/ui/Text";
import { usePalette, createThemedValue } from "@/theme/usePalette";
import { Radius, Spacing } from "@/src/theme/tokens";
import { CheckCircle2, Circle, Sparkles, Target } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface FocusItem {
  id: string;
  text: string;
  completed: boolean;
}

const mockFocusItems: FocusItem[] = [
  { id: "1", text: "Take meds", completed: true },
  { id: "2", text: "Reply to emails", completed: false },
  { id: "3", text: "15 min tidy up", completed: false },
];

export function TodaysFocusCard() {
  const palette = usePalette();
  const styles = useStyles();

  const [items, setItems] = useState<FocusItem[]>(mockFocusItems);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const completedCount = items.filter((item) => item.completed).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <Card variant="elevated" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Target size={20} color={palette.primary} />
        </View>
        <View style={styles.headerText}>
          <Text variant="subheading" style={styles.title}>
            Today&apos;s Focus
          </Text>
          <Text variant="caption" color={palette.textSecondary}>
            Choose 1-3 priorities
          </Text>
        </View>
      </View>

      <View style={styles.itemsList}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => toggleItem(item.id)}
            style={styles.itemRow}
            activeOpacity={0.7}
          >
            {item.completed ? (
              <CheckCircle2 size={22} color={palette.success} />
            ) : (
              <Circle size={22} color={palette.border} />
            )}
            <Text
              variant="body"
              style={[styles.itemText, item.completed && styles.completedText]}
            >
              {item.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ProgressBar
        progress={progress}
        showLabel
        height={6}
        variant="gradient"
      />

      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Sparkles size={16} color={palette.primary} />}
        style={styles.addButton}
      >
        Add a priority
      </Button>
    </Card>
  );
}

const useStyles = createThemedValue((palette) => StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: palette.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  itemsList: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  itemText: {
    flex: 1,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: palette.textTertiary,
  },
  addButton: {
    marginTop: Spacing.md,
    alignSelf: "flex-start",
  },
}));
