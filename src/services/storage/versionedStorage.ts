import {
  getStorageAdapter,
  StorageNamespaces,
  type StorageNamespace,
  type StringStorageAdapter,
} from "./storageAdapter";

export type PersistenceDomain =
  | "tasks"
  | "habits"
  | "cleaning"
  | "meals"
  | "recipes"
  | "groceries"
  | "meal-plans"
  | "budget-categories"
  | "budget-transactions"
  | "payments"
  | "calorie-preferences"
  | "weight"
  | "workouts"
  | "body-measurements"
  | "settings"
  | "onboarding"
  | "brain-dump"
  | "reminders"
  | "reminder-settings"
  | "planning"
  | "planning-parking";

export type PersistenceFailureKind =
  | "unreadable-data"
  | "malformed-data"
  | "unsupported-schema-version"
  | "migration-failure";

interface PersistenceEnvelope<T> {
  schemaVersion: number;
  data: T;
}

export interface VersionedStorageDefinition<T> {
  domain: PersistenceDomain;
  key: string;
  namespace?: StorageNamespace;
  schemaVersion: number;
  empty: () => T;
  validate: (value: unknown) => value is T;
  migrateLegacy?: (value: unknown) => T;
}

export type PersistenceLoadResult<T> =
  | { status: "empty"; data: T; migrated: false }
  | { status: "ready"; data: T; migrated: boolean };

export class PersistenceLoadError extends Error {
  constructor(
    public readonly domain: PersistenceDomain,
    public readonly kind: PersistenceFailureKind,
    message: string,
    public readonly rawData?: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PersistenceLoadError";
  }
}

const RECOVERY_PREFIX = "lumo:recovery:";
const MIGRATION_PREFIX = "lumo:persistence-migration:";

function storageFor<T>(
  definition: VersionedStorageDefinition<T>,
  storage?: StringStorageAdapter,
): StringStorageAdapter {
  return (
    storage ??
    getStorageAdapter(definition.namespace ?? StorageNamespaces.DEFAULT)
  );
}

function migrationKey(domain: PersistenceDomain): string {
  return `${MIGRATION_PREFIX}${domain}`;
}

function legacyBackupKey(domain: PersistenceDomain, version: number): string {
  return `${RECOVERY_PREFIX}${domain}:legacy:v${version}`;
}

function recoveryBackupKey(domain: PersistenceDomain): string {
  return `${RECOVERY_PREFIX}${domain}:invalid:${Date.now()}`;
}

function parseJson(
  domain: PersistenceDomain,
  raw: string,
): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch (cause) {
    throw new PersistenceLoadError(
      domain,
      "malformed-data",
      `Stored ${domain} data is not valid JSON.`,
      raw,
      cause,
    );
  }
}

function readRaw<T>(
  definition: VersionedStorageDefinition<T>,
  storage: StringStorageAdapter,
): string | undefined {
  try {
    if (!storage.contains(definition.key)) return undefined;
    const raw = storage.getString(definition.key);
    if (raw === undefined) {
      throw new Error("The storage key exists but cannot be read as a string.");
    }
    return raw;
  } catch (cause) {
    if (cause instanceof PersistenceLoadError) throw cause;
    throw new PersistenceLoadError(
      definition.domain,
      "unreadable-data",
      `Stored ${definition.domain} data could not be read.`,
      undefined,
      cause,
    );
  }
}

function isEnvelope(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      Object.prototype.hasOwnProperty.call(value, "schemaVersion"),
  );
}

function decodeCurrentEnvelope<T>(
  definition: VersionedStorageDefinition<T>,
  parsed: unknown,
  raw: string,
): T | undefined {
  if (!isEnvelope(parsed)) return undefined;

  const version = parsed.schemaVersion;
  if (!Number.isInteger(version) || version !== definition.schemaVersion) {
    throw new PersistenceLoadError(
      definition.domain,
      "unsupported-schema-version",
      `Stored ${definition.domain} data uses unsupported schema version ${String(version)}.`,
      raw,
    );
  }

  if (!definition.validate(parsed.data)) {
    throw new PersistenceLoadError(
      definition.domain,
      "malformed-data",
      `Stored ${definition.domain} data does not match its schema.`,
      raw,
    );
  }

  return parsed.data;
}

function migrateLegacyData<T>(
  definition: VersionedStorageDefinition<T>,
  parsed: unknown,
  raw: string,
  storage: StringStorageAdapter,
): T {
  const marker = migrationKey(definition.domain);
  const backup = legacyBackupKey(
    definition.domain,
    definition.schemaVersion,
  );

  try {
    const migrated = definition.migrateLegacy
      ? definition.migrateLegacy(parsed)
      : parsed;
    if (!definition.validate(migrated)) {
      throw new Error("Legacy data did not produce a valid current record.");
    }

    if (!storage.contains(backup)) storage.set(backup, raw);
    storage.set(
      marker,
      JSON.stringify({
        schemaVersion: definition.schemaVersion,
        sourceKey: definition.key,
      }),
    );
    storage.set(
      definition.key,
      JSON.stringify({
        schemaVersion: definition.schemaVersion,
        data: migrated,
      } satisfies PersistenceEnvelope<T>),
    );

    const written = storage.getString(definition.key);
    if (written === undefined) throw new Error("Migrated data could not be verified.");
    const verified = decodeCurrentEnvelope(
      definition,
      JSON.parse(written) as unknown,
      written,
    );
    if (verified === undefined) throw new Error("Migration wrote no schema envelope.");
    storage.remove(marker);
    return verified;
  } catch (cause) {
    throw new PersistenceLoadError(
      definition.domain,
      "migration-failure",
      `Stored ${definition.domain} data could not be migrated safely.`,
      raw,
      cause,
    );
  }
}

export function loadVersionedData<T>(
  definition: VersionedStorageDefinition<T>,
  storageOverride?: StringStorageAdapter,
): PersistenceLoadResult<T> {
  const storage = storageFor(definition, storageOverride);
  try {
    if (storage.contains(migrationKey(definition.domain))) {
      const raw = readRaw(definition, storage);
      throw new PersistenceLoadError(
        definition.domain,
        "migration-failure",
        `A previous ${definition.domain} migration was interrupted.`,
        raw,
      );
    }
  } catch (cause) {
    if (cause instanceof PersistenceLoadError) throw cause;
    throw new PersistenceLoadError(
      definition.domain,
      "unreadable-data",
      `Migration state for ${definition.domain} could not be read.`,
      undefined,
      cause,
    );
  }

  const raw = readRaw(definition, storage);
  if (raw === undefined) {
    return { status: "empty", data: definition.empty(), migrated: false };
  }

  const parsed = parseJson(definition.domain, raw);
  const current = decodeCurrentEnvelope(definition, parsed, raw);
  if (current !== undefined) {
    return { status: "ready", data: current, migrated: false };
  }

  try {
    return {
      status: "ready",
      data: migrateLegacyData(definition, parsed, raw, storage),
      migrated: true,
    };
  } catch (cause) {
    if (cause instanceof PersistenceLoadError) throw cause;
    throw new PersistenceLoadError(
      definition.domain,
      "migration-failure",
      `Stored ${definition.domain} data could not be migrated safely.`,
      raw,
      cause,
    );
  }
}

export function saveVersionedData<T>(
  definition: VersionedStorageDefinition<T>,
  data: T,
  storageOverride?: StringStorageAdapter,
): void {
  if (!definition.validate(data)) {
    throw new PersistenceLoadError(
      definition.domain,
      "malformed-data",
      `Refusing to save invalid ${definition.domain} data.`,
    );
  }

  const storage = storageFor(definition, storageOverride);
  // This read is deliberate: a failed load must never become a destructive save.
  loadVersionedData(definition, storage);
  storage.set(
    definition.key,
    JSON.stringify({
      schemaVersion: definition.schemaVersion,
      data,
    } satisfies PersistenceEnvelope<T>),
  );
}

export function recoverDomainWithEmptyData<T>(
  definition: VersionedStorageDefinition<T>,
  storageOverride?: StringStorageAdapter,
): void {
  const storage = storageFor(definition, storageOverride);
  const raw = readRaw(definition, storage);
  if (raw !== undefined) storage.set(recoveryBackupKey(definition.domain), raw);

  storage.set(
    definition.key,
    JSON.stringify({
      schemaVersion: definition.schemaVersion,
      data: definition.empty(),
    } satisfies PersistenceEnvelope<T>),
  );
  storage.remove(migrationKey(definition.domain));
}

export function getRecoveryKeys(
  definition: VersionedStorageDefinition<unknown>,
  storageOverride?: StringStorageAdapter,
): string[] {
  const storage = storageFor(definition, storageOverride);
  return storage
    .getAllKeys()
    .filter((key) => key.startsWith(`${RECOVERY_PREFIX}${definition.domain}:`));
}
