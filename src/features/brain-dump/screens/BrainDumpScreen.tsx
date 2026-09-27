import { EmptyState } from "@/src/components/ui/EmptyState";
import { Input } from "@/src/components/ui/Input";
import { Screen } from "@/src/components/ui/Screen";
import { ScreenBackButton } from "@/src/components/ui/ScreenBackButton";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { convertBrainDumpEntry, useBrainDump } from "@/src/features/brain-dump";
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
  const brainDump = useBrainDump();
  const { addEntry, deleteEntry, openEntries, updateEntry } = brainDump;
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
    try {
      await convertBrainDumpEntry(entry, target, {
        beginConversion: brainDump.beginConversion,
        completeConversion: brainDump.convertEntry,
        createTask,
        createReminder: reminders.addReminder,
      }, scheduledAt);
    } catch {
      Alert.alert(
        "Conversion wasn't completed",
        "Your note is still here. Please try converting it again.",
      );
    }
  };

  const handleDelete = (entry: BrainDumpEntry) => {
    Alert.alert(
      "Delete this?",
      "This removes it from Lumo. You can park it instead if you may want it later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Park instead",
          onPress: () => void handleConvert(entry, "archived_note"),
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
              onEdit={updateEntry}
            />
          ))
        )}
      </View>
      {brainDump.entries.some(
        (entry) => entry.status === "converted" && entry.convertedTo === "routine_idea",
      ) && (
        <View style={styles.list}>
          <SectionHeader
            title="Routine ideas"
            subtitle="Saved notes you can revisit and edit."
          />
          {brainDump.entries
            .filter(
              (entry) =>
                entry.status === "converted" && entry.convertedTo === "routine_idea",
            )
            .map((entry) => (
              <BrainDumpEntryCard
                key={entry.id}
                entry={entry}
                onConvert={handleConvert}
                onEdit={updateEntry}
                readOnlyNote
              />
            ))}
        </View>
      )}
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
