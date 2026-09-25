# Local data schema and recovery contract

**Scope:** WP2.2. Canonical ownership and legacy-key precedence remain defined by [local-data-ownership.md](./local-data-ownership.md).

## Active schemas

Every active local domain now persists a versioned envelope at its existing canonical key:

```json
{
  "schemaVersion": 1,
  "data": {}
}
```

The domain-specific `data` value is validated before it reaches application state. The active registry in `src/services/storage/domainSchemas.ts` covers tasks, habits, settings, onboarding, brain dump, reminders, reminder settings and the daily planning summary. Collection records are accepted atomically; a collection containing one invalid item is not partially loaded.

Existing valid unversioned records are legacy version 0. They are validated, copied to a domain-specific recovery key, journalled, written as version 1 and read back before the migration marker is removed. A remaining marker is treated as an interrupted migration and requires recovery instead of being guessed complete.

## Load outcomes

`src/services/storage/versionedStorage.ts` keeps these outcomes distinct:

| Outcome | Meaning | Write behavior |
|---|---|---|
| `empty` | The canonical key does not exist | A valid fresh domain may be created |
| `ready` | A current envelope or safely migrated legacy record passed validation | Normal domain writes are allowed |
| `unreadable-data` | The adapter could not read the key or migration state | Retry only; no overwrite is offered |
| `malformed-data` | JSON is invalid, the JSON shape is wrong or a field is invalid | Raw canonical value is untouched |
| `unsupported-schema-version` | The envelope version is not the exact supported version | Raw canonical value is untouched |
| `migration-failure` | Conversion, migration write/verification or a prior migration was interrupted | Source/backup and marker are retained |

Every save first performs the guarded load. A parse, validation, version or migration failure therefore cannot be converted into an empty-state write.

## Recovery behavior

The root local-data gate hydrates every active domain before rendering routes. Hydration settles as either ready or a full-screen actionable recovery state using the existing recovery component. Retry performs no write. An explicit “Archive and reset” action:

1. copies the exact current raw value to `lumo:recovery:<domain>:invalid:<timestamp>`;
2. writes a valid empty version-1 envelope for only that domain;
3. clears only that domain's interrupted-migration marker; and
4. re-runs all hydration so unaffected domains remain available and validated.

Unreadable storage only offers retry because Lumo cannot first preserve a value it cannot read. Recovery never clears a namespace or another domain.

WP2.3 still owns serialized concurrent mutations and durable UI acknowledgement. WP2.4 still owns local date/time semantics.
