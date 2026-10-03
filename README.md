# Azure DevOps Child Generator

This repository contains an Azure DevOps extension that will eventually generate child work
items from reusable work item templates.

## Current state

The extension exposes a project settings page under the Azure DevOps project administration
hub. The page currently renders a placeholder ("Child generator page loaded") built with React
\+ TypeScript, and serves as the foundation for the real configuration UI.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite HTTPS dev server (for local debugging, see below) |
| `npm run build` | Type-check + bundle production assets into `dist/` |
| `npm run typecheck` | Run `tsc --noEmit` only |
| `npm test` | Run the Jest test suite |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run test:coverage` | Run Jest with a coverage report |
| `npm run lint` / `lint:fix` | Run ESLint (optionally auto-fixing) |
| `npm run package` | Build, then create a `.vsix` via `tfx extension create` |
| `npm run package:dev` | Create a `.vsix` from `vss-extension.dev.json` (see below) |
| `npm run validate` | Lint + typecheck + test:coverage + build in one pass (CI-friendly) |

## Local development

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Day-to-day development (type-check, test, lint) doesn't require Azure DevOps at all — just
   edit code and run the scripts above.

### Debugging inside Azure DevOps without republishing every change

Azure DevOps extensions normally require publishing a new version to see changes, which is slow
for iterative UI work. This repo avoids that with a **local HTTPS dev server + manifest
override**:

1. Start the dev server:
   ```bash
   npm run dev
   ```
   This serves the extension over `https://localhost:3000` with a self-signed certificate and
   hot module reloading.
2. **One-time setup:** package and publish the *dev* manifest to a test organization/publisher:
   ```bash
   npm run package:dev
   tfx extension publish --manifest-globs vss-extension.dev.json --token <PAT>
   ```
   `vss-extension.dev.json` declares a separate extension id (`child-generator-dev`) with
   `baseUri` set to `https://localhost:3000`, so its hub loads `project-settings.dev.html`
   directly from your local dev server instead of packaged files.
3. Install the dev extension once in a test organization (Shared or private install).
4. The first time you open the page, your browser will warn about the self-signed
   certificate — visit `https://localhost:3000` directly once and accept it.
5. From then on: edit code, keep `npm run dev` running, and just refresh the Azure DevOps page
   to see changes — no republishing needed. Only republish the dev manifest if you change
   `vss-extension.dev.json` itself (e.g. add a new contribution).

Replace the placeholder publisher value in `vss-extension.json` / `vss-extension.dev.json` with
your real Azure DevOps extension publisher before publishing either manifest.

## Testing

Tests live alongside the code they cover (e.g. `App.test.tsx` next to `App.tsx`) and use Jest +
`@testing-library/react`. Run `npm run test:coverage` to generate a coverage report in
`coverage/` (gitignored).

## Linting

ESLint uses a flat config (`eslint.config.js`) with `typescript-eslint` and the React/React
Hooks plugins. Run `npm run lint` before committing, or `npm run lint:fix` to auto-fix what it
can.
