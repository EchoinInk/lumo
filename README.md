# Lumo Mobile

Lumo is a calm, neurodivergent-first personal operating system built with Expo and React Native.

## Development

```bash
npm ci
npm start
```

The project uses Expo Router. Route files live in `app/`; feature modules, shared components, services, state, and design tokens live in `src/`.

## Validation

Run the complete Phase 1 validation suite before committing:

```bash
npm run validate
```

Each command can also be run independently:

```bash
npm run typecheck
npm test
npm run lint
npm run doctor
npm run export:web
```

`export:web` creates a disposable static web bundle in `dist/`, which is ignored by Git. Native device/simulator checks still need to be performed in their respective environments.

## Running the app

```bash
npm start
npm run android
npm run ios
npm run web
```

Use a development build for native modules that Expo Go does not support. Do not add environment files containing secrets to source control.
