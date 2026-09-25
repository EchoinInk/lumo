import { EmptyState } from "@/src/components/ui/EmptyState";
import { Input } from "@/src/components/ui/Input";
import { Screen } from "@/src/components/ui/Screen";
import { ScreenBackButton } from "@/src/components/ui/ScreenBackButton";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { useBrainDump } from "@/src/features/brain-dump";
import type {
  BrainDumpConversionTarget,
  BrainDumpEntry,
} from "@/src/features/brain-dump";
import { useReminders } from "@/src/features/reminders";
import { useTasks } from "@/src/features/tasks";
import { Spacing } from "@/src/theme/tokens";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button } from "@/src/components/ui/Button";
import { BrainDumpEntryCard } from "../components/BrainDumpEntryCard";

export default function BrainDumpScreen() {
  const [text, setText] = useState("");
  const { addEntry, convertEntry, deleteEntry, openEntries } = useBrainDump();
  const { createTask } = useTasks();
  const reminders = useReminders();

  const handleAdd = () => {
    const entry = addEntry({ text });
    if (entry) {
      setText("");
    }
  };

  const handleConvert = async (
    entry: BrainDumpEntry,
    target: BrainDumpConversionTarget,
    scheduledAt?: string,
  ) => {
    if (target === "task") {
      try {
        const result = await createTask({
          title: entry.text,
          priority: "medium",
        });
        convertEntry(entry.id, target, result.value.id);
      } catch {
        Alert.alert(
          "Task wasn't created",
          "Your note is still here. Please try converting it again.",
        );
      }
      return;
    }

    if (target === "reminder") {
      const reminder = reminders.addReminder({ title: entry.text, scheduledAt });
      convertEntry(entry.id, target, reminder?.id);
      return;
    }

    convertEntry(entry.id, target);
  };

  const handleDelete = (entry: BrainDumpEntry) => {
    Alert.alert(
      "Delete this?",
      "This removes it from Lumo. You can park it instead if you may want it later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Park instead",
          onPress: () => convertEntry(entry.id, "archived_note"),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteEntry(entry.id),
        },
      ],
    );
  };

  return (
    <Screen scrollable padded keyboardAvoiding>
      <ScreenBackButton fallbackPath="/(tabs)" />
      <SectionHeader
        title="Brain Dump"
        subtitle="Unload first. Decide later."
      />
      <View style={styles.secondaryAction}>
        <Button
          size="sm"
          variant="ghost"
          onPress={() => router.push({ pathname: "/parked" as const } as any)}
          accessibilityRole="button"
          accessibilityLabel="Parked thoughts"
          accessibilityHint="Opens thoughts and items saved for later"
        >
          Parked thoughts
        </Button>
      </View>

      <View style={styles.capture}>
        <Input
          value={text}
          onChangeText={setText}
          placeholder="Drop the thought here"
          accessibilityLabel="Brain dump thought"
          multiline
          helperText="No categories. No pressure."
        />
        <Button
          onPress={handleAdd}
          disabled={!text.trim()}
          accessibilityHint="Saves this thought locally"
        >
          Capture thought
        </Button>
      </View>

      <View style={styles.list}>
        {openEntries.length === 0 ? (
          <EmptyState
            title="Nothing waiting"
            description="When your mind feels full, this space can hold it for you."
          />
        ) : (
          openEntries.map((entry) => (
            <BrainDumpEntryCard
              key={entry.id}
              entry={entry}
              onConvert={handleConvert}
              onDelete={handleDelete}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  secondaryAction: {
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  capture: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  list: {
    gap: Spacing.md,
  },
});
