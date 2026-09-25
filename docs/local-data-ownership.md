# Local data ownership and storage compatibility

**Scope:** WP2.1 only. This record establishes ownership, namespace compatibility, and migration precedence. Schema envelopes and corrupted-data recovery remain WP2.2.

## Canonical ownership

| Domain | Canonical production owner | Canonical storage | Legacy paths retained for compatibility |
|---|---|---|---|
| Tasks | `src/features/tasks/store/useTaskStore.ts` through `src/features/tasks/services/taskLocalRepository.ts` | Default MMKV namespace, key `tasks` | `src/store/useTaskStore.ts` was memory-only and is now a compatibility alias. `src/services/taskRepository.ts` delegates to the feature repository. There is no persisted legacy task collection to merge. |
| Habits | `src/features/habits/store/useHabitStore.ts` through `src/features/habits/services/habitLocalRepository.ts` | Default MMKV namespace, key `habits` | Newer legacy Zustand record: `lumo-storage` / `habit-storage`. Older prefixed record: default namespace / `habits_habit-storage`. The old store path is now a compatibility alias and the generic repository delegates to the feature repository. |
| Settings | `src/store/useSettingsStore.ts` | `lumo-storage` namespace, key `settings-storage` | Older prefixed record: default namespace / `settings_settings-storage`; declared direct key: default namespace / `user_settings`. The established `lumo-storage` namespace is preserved. |
| Onboarding | `src/features/onboarding/store/useOnboardingStore.ts` | Default MMKV namespace, key `onboarding` | Newer legacy Zustand record: `lumo-storage` / `onboarding-storage`. Older prefixed record: default namespace / `onboarding_onboarding-storage`. The old store path is now a compatibility alias. |

The executable ownership registry is `src/services/storage/canonicalOwnership.ts`. Compatibility paths must not own independent production state.

## Adapter contract

Both existing facades now use `src/services/storage/storageAdapter.ts`.

- `src/services/storage/mmkv.ts` addresses the default MMKV namespace and retains existing unprefixed keys.
- `src/store/storage.ts` addresses the historical `lumo-storage` namespace.
- String reads return `undefined` at the common adapter boundary. The Zustand adapter converts a missing value to `null`, as required by `StateStorage`.
- String, number, and boolean writes use one `set` contract. Both `remove` and the historical `delete` spelling resolve to the same operation.
- On web, the default namespace retains unprefixed `localStorage` keys. Named MMKV namespaces use a reserved prefix so identical keys remain isolated.
- Browser writes use durable `localStorage`; the in-memory implementation is limited to environments where browser storage does not exist, such as server rendering.
- `clearAll` is namespace-scoped on every platform.

## Migration precedence

Migrations are synchronous and idempotent so they complete before the relevant store hydrates. Outcomes are recorded under default key `lumo:storage-migration:wp2.1:v1`. Source records are never deleted.

1. A present canonical key always wins, including an intentional empty collection. Any legacy record is retained and the outcome is recorded as `conflict-preserved`; records are never merged.
2. If the canonical key is absent, candidates are tried from newest known path to oldest known path:
   - Habits: `lumo-storage:habit-storage`, then `default:habits_habit-storage`.
   - Settings: `default:settings_settings-storage`, then `default:user_settings`.
   - Onboarding: `lumo-storage:onboarding-storage`, then `default:onboarding_onboarding-storage`.
3. The first wholly compatible candidate is copied into the canonical key. Lower-precedence and selected sources remain untouched.
4. If a higher-precedence candidate is unreadable or incompatible, it remains untouched and the next candidate may be considered.
5. A collection is migrated atomically or not at all. For example, a habit collection containing the unsupported legacy `monthly` frequency is preserved without cherry-picking its other records.
6. Running migration again never overwrites the canonical target.

Legacy habit weekday numbers are mapped explicitly (`0` Sunday through `6` Saturday). Legacy onboarding identifiers are mapped explicitly from camelCase to the feature store’s snake_case identifiers. New settings fields absent from a compatible historical record receive the current safe defaults.

## Deferred boundaries

- WP2.2 owns versioned schema envelopes, strict canonical validation, corrupt-record preservation, and recovery UI.
- WP2.3 owns durable mutation acknowledgement and concurrent write serialization.
- WP2.4 owns local date semantics.
- No new domain, database, or persistence framework is introduced here.
