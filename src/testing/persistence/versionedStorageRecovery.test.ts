import {
  habitStorageDefinition,
  taskStorageDefinition,
} from "@/services/storage/domainSchemas";
import {
  getStorageAdapter,
  StorageNamespaces,
  type StringStorageAdapter,
} from "@/services/storage/storageAdapter";
import {
  getRecoveryKeys,
  loadVersionedData,
  PersistenceLoadError,
  recoverDomainWithEmptyData,
  saveVersionedData,
  type VersionedStorageDefinition,
} from "@/services/storage/versionedStorage";
import { assertEqual, resetTestState } from "../testUtils";

function expectPersistenceError(
  action: () => unknown,
  kind: PersistenceLoadError["kind"],
): PersistenceLoadError {
  try {
    action();
  } catch (error) {
    if (error instanceof PersistenceLoadError) {
      assertEqual(error.kind, kind, `expected ${kind}`);
      return error;
    }
    throw error;
  }
  throw new Error(`Expected ${kind} persistence error`);
}

function memoryStorage(initial: Record<string, string> = {}): StringStorageAdapter {
  const values = new Map(Object.entries(initial));
  const getString = (key: string) => values.get(key);
  const remove = (key: string) => { values.delete(key); };
  return {
    getString,
    set: (key, value) => { values.set(key, String(value)); },
    getNumber: (key) => {
      const value = getString(key);
      return value === undefined || Number.isNaN(Number(value)) ? undefined : Number(value);
    },
    getBoolean: (key) => getString(key) === "true" ? true : getString(key) === "false" ? false : undefined,
    remove,
    delete: remove,
    clearAll: () => values.clear(),
    contains: (key) => values.has(key),
    getAllKeys: () => [...values.keys()],
  };
}

const stringsDefinition: VersionedStorageDefinition<string[]> = {
  domain: "tasks",
  key: "records",
  schemaVersion: 1,
  empty: () => [],
  validate: (value): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === "string"),
};

export function testValidEmptyIsDistinctFromMissingAndMalformedData(): void {
  const storage = memoryStorage();
  const missing = loadVersionedData(stringsDefinition, storage);
  assertEqual(missing.status, "empty", "a missing key should be valid empty data");

  storage.set("records", JSON.stringify({ schemaVersion: 1, data: [] }));
  const presentEmpty = loadVersionedData(stringsDefinition, storage);
  assertEqual(presentEmpty.status, "ready", "a stored empty collection should remain present");

  storage.set("records", "{bad json");
  expectPersistenceError(
    () => loadVersionedData(stringsDefinition, storage),
    "malformed-data",
  );
  assertEqual(storage.getString("records"), "{bad json", "malformed raw data must remain untouched");
}

export function testWrongShapeAndInvalidFieldsAreRejected(): void {
  const storage = memoryStorage({
    records: JSON.stringify({ schemaVersion: 1, data: {} }),
  });
  expectPersistenceError(() => loadVersionedData(stringsDefinition, storage), "malformed-data");

  storage.set(
    "records",
    JSON.stringify({ schemaVersion: 1, data: ["valid", 42] }),
  );
  expectPersistenceError(() => loadVersionedData(stringsDefinition, storage), "malformed-data");
}

export function testUnknownSchemaVersionIsPreserved(): void {
  const raw = JSON.stringify({ schemaVersion: 99, data: ["future"] });
  const storage = memoryStorage({ records: raw });
  expectPersistenceError(
    () => loadVersionedData(stringsDefinition, storage),
    "unsupported-schema-version",
  );
  assertEqual(storage.getString("records"), raw, "future-version data must remain unchanged");
}

export function testUnreadableStorageIsDistinctFromMalformedData(): void {
  const storage = memoryStorage({ records: "[]" });
  storage.getString = () => { throw new Error("read unavailable"); };
  expectPersistenceError(
    () => loadVersionedData(stringsDefinition, storage),
    "unreadable-data",
  );
}

export function testMigrationFailureAndInterruptedMigrationAreActionable(): void {
  const failingDefinition: VersionedStorageDefinition<string[]> = {
    ...stringsDefinition,
    migrateLegacy: () => { throw new Error("fixture migration failed"); },
  };
  const failedStorage = memoryStorage({ records: JSON.stringify(["legacy"]) });
  expectPersistenceError(
    () => loadVersionedData(failingDefinition, failedStorage),
    "migration-failure",
  );
  assertEqual(failedStorage.getString("records"), JSON.stringify(["legacy"]), "failed migration keeps source raw data");

  const interruptedStorage = memoryStorage({ records: JSON.stringify(["legacy"]) });
  const originalSet = interruptedStorage.set;
  let interrupt = true;
  interruptedStorage.set = (key, value) => {
    if (interrupt && key === "records") throw new Error("simulated interruption");
    originalSet(key, value);
  };
  expectPersistenceError(
    () => loadVersionedData(stringsDefinition, interruptedStorage),
    "migration-failure",
  );
  interrupt = false;
  expectPersistenceError(
    () => loadVersionedData(stringsDefinition, interruptedStorage),
    "migration-failure",
  );
}

export function testFailedLoadCannotBecomeDestructiveSave(): void {
  const raw = "{recoverable but malformed";
  const storage = memoryStorage({ records: raw });
  expectPersistenceError(
    () => saveVersionedData(stringsDefinition, ["replacement"], storage),
    "malformed-data",
  );
  assertEqual(storage.getString("records"), raw, "save guard must preserve recoverable raw data");
}

export function testExplicitRecoveryArchivesOneDomainAndPreservesOthers(): void {
  resetTestState();
  const storage = getStorageAdapter(StorageNamespaces.DEFAULT);
  storage.clearAll();
  const badTasks = "{bad tasks";
  storage.set(taskStorageDefinition.key, badTasks);
  storage.set(
    habitStorageDefinition.key,
    JSON.stringify({ schemaVersion: 1, data: [] }),
  );
  const habitsBefore = storage.getString(habitStorageDefinition.key);

  recoverDomainWithEmptyData(taskStorageDefinition);

  assertEqual(
    loadVersionedData(taskStorageDefinition).status,
    "ready",
    "explicit recovery should create valid empty domain data",
  );
  assertEqual(
    storage.getString(habitStorageDefinition.key),
    habitsBefore,
    "recovering tasks must not alter habits",
  );
  const recoveryKeys = getRecoveryKeys(taskStorageDefinition);
  assertEqual(recoveryKeys.length > 0, true, "explicit recovery should archive invalid raw data");
  assertEqual(storage.getString(recoveryKeys[0]!), badTasks, "archive should contain exact invalid raw data");
}
