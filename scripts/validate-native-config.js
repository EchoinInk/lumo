#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const easConfig = require('../eas.json');

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
  [require.resolve('expo/bin/cli'), 'config', '--type', 'public', '--json'],
  { encoding: 'utf8', env },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const config = JSON.parse(result.stdout);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(config.name === 'Lumo', 'Expected the resolved app name to be Lumo.');
assert(config.slug === 'lumo-mobile', 'Expected the resolved app slug to be lumo-mobile.');
assert(config.ios?.bundleIdentifier === 'com.meltmyheart.lumo', 'Missing iOS bundle identifier.');
assert(config.ios?.buildNumber === '1', 'Missing initial iOS build number.');
assert(config.android?.package === 'com.meltmyheart.lumo', 'Missing Android package name.');
assert(config.android?.versionCode === 1, 'Missing initial Android version code.');
assert(!config.updates?.url, 'EAS Update must not be configured during WP1.3.');

const profiles = easConfig.build ?? {};
assert(profiles.development?.developmentClient === true, 'Development profile must create a development client.');
assert(profiles.development?.distribution === 'internal', 'Development profile must use internal distribution.');
assert(profiles.preview?.distribution === 'internal', 'Preview profile must use internal distribution.');
assert(profiles.preview?.android?.buildType === 'apk', 'Android preview profile must create an installable APK.');
assert(profiles.production?.distribution === 'store', 'Production profile must retain store distribution.');

const serializedConfig = JSON.stringify(config);
for (const key of ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY']) {
  assert(!serializedConfig.includes(key), `Resolved public config unexpectedly exposes ${key}.`);
}

console.log('Native config resolved without backend credentials.');
console.log(`iOS: ${config.ios.bundleIdentifier} (${config.ios.buildNumber})`);
console.log(`Android: ${config.android.package} (${config.android.versionCode})`);
console.log(`EAS profiles: ${Object.keys(profiles).join(', ')}`);
