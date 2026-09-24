#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const [, , command, ...args] = process.argv;

if (command !== 'expo') {
  console.error('Usage: node scripts/run-local-first.js expo <arguments...>');
  process.exit(2);
}

const env = { ...process.env, EXPO_NO_DOTENV: '1' };

for (const key of [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
]) {
  delete env[key];
}

const result = spawnSync(
  process.execPath,
  [require.resolve('expo/bin/cli'), ...args],
  { env, stdio: 'inherit' },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
