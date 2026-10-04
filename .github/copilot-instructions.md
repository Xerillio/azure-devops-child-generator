# Copilot instructions

Azure DevOps extension (React 19 + TypeScript, Vite, Jest) that will generate child work items from templates. Currently a scaffold: the project settings page is a placeholder and the work item menu action just shows a "not yet implemented" alert.

## Commands

- `npm run dev` – Vite HTTPS dev server on fixed port 3000 (`strictPort`; must match `baseUri` in `vss-extension.dev.json`)
- `npm run build` – clean + `tsc --noEmit` + `vite build` into `dist/`
- `npm run typecheck`, `npm run lint` (`lint:fix` to autofix)
- `npm test` – Jest; single test: `npx jest src/pages/project-settings/App.test.tsx -t "<test name>"`
- `npm run test:coverage` – coverage + sonar report (used by CI, then SonarCloud)
- `npm run validate` – lint + typecheck + coverage + build
- `npm run package` / `package:dev` – create `.vsix` with `tfx`
- Husky pre-commit runs `npm test` then `npm run lint`.

Always use `npm run validate` to validate changes.

## Tech stack

- **UI:** React + TypeScript
- **Build/dev server:** Vite
- **Tests:** Jest + Testing Library (with coverage)
- **Linting:** ESLint (flat config) + typescript-eslint
- **Packaging/publishing:** `tfx-cli`

## Architecture

- Each Azure DevOps contribution is its own page under `src/pages/<name>/` with `index.tsx` (calls `SDK.init`/`SDK.ready`, mounts React root) and, for UI pages, `App.tsx`. `work-item-menu` is an action with no UI (only `index.tsx`).
- Adding a contribution touches several files that must stay in sync:
  1. `src/pages/<name>/index.tsx` (+ `App.tsx`)
  2. entry in the `pages` map in `vite.config.ts`
  3. `<name>.html` (loads `./dist/<name>.js`) and `<name>.dev.html` (loads TSX source for HMR)
  4. contribution + `files` entry in both `vss-extension.json` and `vss-extension.dev.json`
- Build output uses fixed non-hashed entry filenames (`[name].js`) so the static HTML shells can reference stable paths; Vite uses `rolldownOptions`.
- The dev manifest is a separate extension (`child-generator-dev`) with `baseUri` `https://localhost:3000`; it only needs republishing when `vss-extension.dev.json` changes.
- The extension currently adds the following pages/components:
  1. `src\pages\project-settings`: a page in the project settings where you can configure templates and when the templates should be used to generate child items.
  2. `src\pages\work-item-menu`: a context menu item on work items. When clicked it will generate child items based on the configured templates.

## Conventions

- Use `@fluentui/react-components` and `"@fluentui/react-icons` for UI components in the extension, including project settings and any future panels or dialogs.
- `typescript` is intentionally pinned to 6.0.3 (TS 7 unsupported by typescript-eslint/tooling); don't bump it.
- Jest uses `babel-jest` (`babel.config.cjs`, used only for tests), jsdom, and `tests/setupTests.ts` (jest-dom). Tests are colocated as `src/**/*.test.{ts,tsx}` — other locations aren't matched.
- ESLint is flat config (`eslint.config.js`) with typescript-eslint and React/Hooks plugins; the project is ESM (`"type": "module"`).
- Handle SDK init promises explicitly (`void SDK.init(...)`, `.catch(...)`), as in `work-item-menu/index.tsx`.

## Tools

### File reading and writing

When inspecting repository files, prefer the built-in file `read`/`view` tool whenever available. Similarly, for modifying files, prefer using the built-in `write` tool whenever available.

Do not use PowerShell (`Get-Content`, `gc`, `type`, `Set-Content`, `Out-File`) or shell commands such as `cat` to read and write files unless the built-in read and write tools cannot perform the required operation.

Use shell commands for actual command execution (builds, tests, git operations, scripts, etc.), not for ordinary file inspection.
