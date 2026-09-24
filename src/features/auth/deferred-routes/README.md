# Deferred account routes

These screens are preserved for a future account/cloud work package, but they
must remain outside Expo Router's `app/` directory for the local-only release.
Expo Router includes route modules in the native production graph, so moving a
screen back under `app/` would also reintroduce its Supabase dependency.

Do not expose these screens until authentication, ownership migration, and
native production compatibility are implemented and validated together.
