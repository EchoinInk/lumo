import {
  loadBrainDumpEntries,
  persistBrainDumpEntries,
  sanitizeBrainDumpEntries,
} from "@/features/brain-dump/services/brainDumpStorage";
import { useBrainDumpStore } from "@/features/brain-dump/store/useBrainDumpStore";
import { deleteKey, setString } from "@/services/storage/mmkv";
import { StorageKeys } from "@/services/storage/storageKeys";
import { assertEqual, resetTestState } from "../testUtils";
import { PersistenceLoadError } from "@/services/storage/versionedStorage";

export async function testSanitizeBrainDumpEntriesFiltersInvalidRecords(): Promise<void> {
  const entries = sanitizeBrainDumpEntries([
    { id: "ok", text: "Valid", status: "open", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
    { id: "bad", text: "", status: "open" },
    { bad: true },
  ]);

  assertEqual(entries.length, 1, "invalid brain dump entries should be filtered");
  assertEqual(entries[0]?.id, "ok", "valid entry should remain");
}

export async function testLoadBrainDumpEntriesRejectsCorruptJson(): Promise<void> {
  resetTestState();
  setString(StorageKeys.BRAIN_DUMP_ENTRIES, "{not json");

  try {
    loadBrainDumpEntries();
    throw new Error("corrupt brain dump data should not load as empty");
  } catch (error) {
    assertEqual(
      error instanceof PersistenceLoadError && error.kind,
      "malformed-data",
      "corrupt brain dump data should be recoverable",
    );
  }
}

export async function testConvertEntryIsIdempotent(): Promise<void> {
  resetTestState();
  deleteKey(StorageKeys.BRAIN_DUMP_ENTRIES);
  useBrainDumpStore.setState({ entries: [], hasHydrated: false });

  const entry = useBrainDumpStore.getState().addEntry({ text: "Convert me" });
  assertEqual(entry?.status, "open", "new entry should start open");

  useBrainDumpStore.getState().convertEntry(entry!.id, "task", "task-1");
  const afterFirst = useBrainDumpStore.getState().entries[0];
  assertEqual(afterFirst?.status, "converted", "first conversion should succeed");

  useBrainDumpStore.getState().convertEntry(entry!.id, "task", "task-2");
  const afterSecond = useBrainDumpStore.getState().entries[0];
  assertEqual(
    afterSecond?.linkedEntityId,
    "task-1",
    "second conversion should not overwrite converted entry",
  );

  persistBrainDumpEntries(useBrainDumpStore.getState().entries);
  const loadedEntries = loadBrainDumpEntries();
  assertEqual(loadedEntries.length, 1, "converted entry should persist");
  assertEqual(
    loadedEntries[0]?.status,
    "converted",
    "converted entry should not reload as unreviewed",
  );
}

export async function testArchivedBrainDumpEntryCanBeRestored(): Promise<void> {
  useBrainDumpStore.setState({ entries: [], hasHydrated: false });

  const entry = useBrainDumpStore.getState().addEntry({ text: "Park this" });
  useBrainDumpStore.getState().archiveEntry(entry!.id);
  assertEqual(
    useBrainDumpStore.getState().entries[0]?.status,
    "archived",
    "archive should park the thought",
  );

  useBrainDumpStore.getState().restoreEntry(entry!.id);
  const restored = useBrainDumpStore.getState().entries[0];

  assertEqual(restored?.status, "open", "restored thought should return open");
  assertEqual(
    restored?.convertedTo,
    undefined,
    "restored thought should clear archive conversion metadata",
  );
}

export async function testBrainDumpEntryCanBeDeletedPermanently(): Promise<void> {
  resetTestState();
  useBrainDumpStore.setState({ entries: [], hasHydrated: false });

  const entry = useBrainDumpStore.getState().addEntry({ text: "Remove this" });
  useBrainDumpStore.getState().deleteEntry(entry!.id);

  assertEqual(
    useBrainDumpStore.getState().entries.length,
    0,
    "deleted thought should leave in-memory state",
  );
  assertEqual(
    loadBrainDumpEntries().length,
    0,
    "deleted thought should not reload from storage",
  );
}

export async function testPendingConversionAndEditSurviveRestart(): Promise<void> {
  resetTestState();
  useBrainDumpStore.setState({ entries: [], hasHydrated: false });
  const entry = useBrainDumpStore.getState().addEntry({ text: "Original note" })!;
  const conversionId = useBrainDumpStore
    .getState()
    .beginConversion(entry.id, "task");
  useBrainDumpStore.getState().updateEntry(entry.id, "Edited note");

  useBrainDumpStore.setState({ entries: [], hasHydrated: false });
  useBrainDumpStore.getState().hydrate();
  const restored = useBrainDumpStore.getState().entries[0];

  assertEqual(restored?.text, "Edited note", "edits should persist across restart");
  assertEqual(
    restored?.conversionId,
    conversionId,
    "an interrupted conversion should retain stable identity",
  );
  assertEqual(
    restored?.status,
    "open",
    "an interrupted conversion should remain actionable",
  );
}
