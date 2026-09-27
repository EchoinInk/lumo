import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { Text } from "@/src/components/ui/Text";
import type {
  BrainDumpConversionTarget,
  BrainDumpEntry,
} from "@/src/features/brain-dump";
import {
  getReminderScheduledAt,
  reminderScheduleOptions,
  type ReminderScheduleOptionId,
} from "@/src/features/reminders";
import { Colors, Spacing } from "@/src/theme/tokens";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

interface BrainDumpEntryCardProps {
  entry: BrainDumpEntry;
  onConvert: (
    entry: BrainDumpEntry,
    target: BrainDumpConversionTarget,
    scheduledAt?: string,
  ) => void;
  onDelete?: (entry: BrainDumpEntry) => void;
  onEdit?: (id: string, text: string) => boolean;
  readOnlyNote?: boolean;
}

export function BrainDumpEntryCard({
  entry,
  onConvert,
  onDelete,
  onEdit,
  readOnlyNote = false,
}: BrainDumpEntryCardProps) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSchedulingReminder, setIsSchedulingReminder] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(entry.text);

  const handleReminderSchedule = (optionId: ReminderScheduleOptionId) => {
    onConvert(entry, "reminder", getReminderScheduledAt(optionId));
  };

  return (
    <Card variant="outlined" style={styles.card}>
      {isEditing ? (
        <Input
          value={draft}
          onChangeText={setDraft}
          multiline
          accessibilityLabel="Edit brain dump thought"
        />
      ) : (
        <Text variant="body" style={styles.text}>
          {entry.text}
        </Text>
      )}
      <Text variant="caption" color={Colors.textTertiary}>
        Review gently when ready.
      </Text>
      <View style={styles.actions}>
        {onEdit && (isEditing ? (
          <>
            <Button size="sm" onPress={() => {
              if (onEdit(entry.id, draft)) setIsEditing(false);
            }}>Save edit</Button>
            <Button size="sm" variant="ghost" onPress={() => {
              setDraft(entry.text);
              setIsEditing(false);
            }}>Cancel edit</Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onPress={() => setIsEditing(true)}>
            Edit
          </Button>
        ))}
      </View>
      {readOnlyNote ? null : !isReviewing ? (
        <Button
          size="sm"
          variant="secondary"
          onPress={() => setIsReviewing(true)}
          accessibilityLabel="Review brain dump thought"
          accessibilityHint="Shows calm options for sorting this thought"
        >
          Review / Sort
        </Button>
      ) : isSchedulingReminder ? (
        <View style={styles.actions}>
          <Text
            variant="caption"
            color={Colors.textSecondary}
            style={styles.actionLabel}
          >
            When should this reminder appear?
          </Text>
          {reminderScheduleOptions.map((option) => (
            <Button
              key={option.id}
              size="sm"
              variant={option.id === "tomorrow" ? "secondary" : "ghost"}
              onPress={() => handleReminderSchedule(option.id)}
              accessibilityLabel={option.accessibilityLabel}
              accessibilityHint="Creates a reminder with this schedule"
            >
              {option.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onPress={() => setIsSchedulingReminder(false)}
            accessibilityLabel="Back to sorting options"
          >
            Back
          </Button>
        </View>
      ) : (
        <View style={styles.actions}>
          <Text
            variant="caption"
            color={Colors.textSecondary}
            style={styles.actionLabel}
          >
            Sort this thought
          </Text>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => onConvert(entry, "task")}
            accessibilityLabel="Convert to task"
            accessibilityHint="Creates a task from this thought"
          >
            Convert to task
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => setIsSchedulingReminder(true)}
            accessibilityLabel="Convert to reminder"
            accessibilityHint="Shows simple reminder schedule choices"
          >
            Convert to reminder
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => onConvert(entry, "routine_idea")}
            accessibilityLabel="Save as routine idea"
            accessibilityHint="Marks this thought as a routine idea for later"
          >
            Routine idea
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => onConvert(entry, "archived_note")}
            accessibilityLabel="Archive thought"
            accessibilityHint="Parks this thought so it no longer appears in review"
          >
            Archive / park
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onPress={() => onDelete(entry)}
              accessibilityLabel="Delete thought"
              accessibilityHint="Asks for confirmation before permanently removing this thought"
            >
              Delete
            </Button>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  text: {
    lineHeight: 24,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionLabel: {
    width: "100%",
  },
});
