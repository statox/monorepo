# SDK Package Design

**Date:** 2026-05-20
**Status:** Approved

## Problem

The SDK that lets the frontend call the backend is generated via Nunjucks templates. The static client code (`APIClient`, `ApiError`, AJV helpers) lives inside `sdk.njk`, mixed with templating logic. This makes it hard to read, test, and evolve as real TypeScript.

## Goal

Move the SDK to a proper TypeScript package at `packages/sdk/`. The generator produces only a pure data file (schemas + types). The client code lives as first-class TypeScript, tested independently.

## Decisions

- **Generated code is committed to git.** `packages/sdk/src/generated/routes.ts` is not gitignored. Route diffs are reviewable alongside route changes.
- **Generator stays in `back/scripts/`.** `npm run generate:sdk` in `back/package.json` is updated to write to `packages/sdk/src/generated/routes.ts`. No new root-level orchestration.
- **Frontend installs via `file:` reference.** `front/package.json` adds `"statox-api": "file:../packages/sdk"`. Import changes from `$vendor/statox-api` to `statox-api`.
- **Source-only package (no build step).** `exports` points at `./src/index.ts`. Vite resolves and compiles TypeScript source natively. Documented in README.

## Package Structure

```
packages/sdk/
├── src/
│   ├── client.ts              # APIClient, ApiError, AJV validation helpers
│   ├── generated/
│   │   └── routes.ts          # AUTO-GENERATED - committed to git
│   └── index.ts               # export { APIClient, BaseAPIClient, ApiError, ... } from './client.js'; export type * from './generated/routes.js'
├── tests/
│   ├── mocha/
│   │   └── sdk.json           # Mocha config
│   └── client.test.ts         # Unit tests for client.ts (migrated from back/tests/scripts/)
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── .prettierrc
└── README.md
```

## Data Flow

### Route lifecycle

1. Developer adds/updates a route in `back/src/libs/routes/`
2. Runs `npm run generate:sdk` from `back/`
3. Generator writes `packages/sdk/src/generated/routes.ts`
4. Developer commits both changes together
5. Frontend picks up new types on next build - no extra steps

### What `generated/routes.ts` contains

- `schemas` const object (all route input/output JSON schemas)
- Type exports via `FromSchema<typeof schemas.X>`
- Error union types per endpoint (`Auth_Login_Errors = 'UNAUTHORIZED' | ... | 'NETWORK_ERROR'`)
- `buildModules(fetch: FetchFn)` — thin per-route arrow functions that call into `BaseAPIClient._fetch`; used by the `APIClient` factory in `client.ts`
- Header comment: `// AUTO-GENERATED - do not edit. Run: cd back && npm run generate:sdk`

### What `generated/routes.ts` does NOT contain

- `APIClient`, `ApiError`, AJV setup, or any request logic (those live in `src/client.ts`)

## Package Configuration

### `package.json`

```json
{
  "name": "statox-api",
  "version": "1.0.0",
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "check": "npm run lint && npm run prettier",
    "lint": "eslint",
    "prettier": "prettier --check 'src/**/*.ts' 'tests/**/*.ts'",
    "tests": "mocha --config tests/mocha/sdk.json"
  }
}
```

No `build`, no `main`, no `postinstall`. This is intentional - see README.

`src/index.ts` uses `export type *` (not `export *`) for the generated routes. This re-exports only TypeScript type declarations, hiding the runtime values `schemas` and `buildModules` from consumers. All input/output/error types remain accessible; the internal plumbing does not leak.

### `tsconfig.json`

Mirrors `back/tsconfig.json` with two additions: `lib` includes `"dom"` (for `fetch`, `Response`, etc.) and `types` explicitly declares `["node", "mocha"]` so Mocha globals (`describe`, `it`) are available in tests without import.

```json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "lib": ["es2023", "dom"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "skipLibCheck": true,
    "strict": true,
    "target": "es2022",
    "types": ["node", "mocha"]
  }
}
```

No `outDir` (no build step).

## Frontend Wiring

`front/package.json`:
```json
"statox-api": "file:../packages/sdk"
```

After `npm install`, npm symlinks `front/node_modules/statox-api → ../../packages/sdk`. Vite resolves the `exports` field, finds `./src/index.ts`, and compiles it as part of the frontend build. No special Vite config required.

`front/src/lib/api/client2.ts` changes:
```ts
// Before
import { APIClient } from '$vendor/statox-api';
// After
import { APIClient } from 'statox-api';
```

The `$vendor` path alias and `front/src/vendor/statox-api/` directory are deleted.

## Testing

### `packages/sdk/tests/client.test.ts`

Migrated from `back/tests/scripts/generateSDK.test.ts` categories 3 and 4 (TypeScript transpilation and runtime instantiation). These now test `src/client.ts` directly - no generated code involved, no VM sandbox needed.

### `back/tests/scripts/generateSDK.test.ts`

Updated: categories 3 and 4 are removed (moved to SDK package). Categories 1 and 2 (groupRoutes unit tests, output string assertions) are updated to assert the new `routes.ts` shape - schemas + types only, no client code in the output.

## What Gets Deleted

- `front/src/vendor/statox-api/index.ts` - replaced by `packages/sdk/src/generated/routes.ts`
- `front/src/vendor/statox-api/` directory

`back/scripts/templates/sdk.njk` and `route.njk` are **kept**. The generator continues to use Nunjucks; the templates were updated (removed `async`, redundant `: Promise<T>` return annotation, and `/* eslint-disable require-await */`) but not replaced.

## README Requirements

The `packages/sdk/README.md` must document:

1. **Why `exports` points at `.ts` source** - private monorepo, Vite handles TS natively, no npm publish
2. **No build step by design** - consequences for any future consumer outside Vite
3. **How to consume** - add `"statox-api": "file:../packages/sdk"` to `package.json`, run `npm install`
4. **Generate → commit → use lifecycle** - when and how to regenerate `routes.ts`
5. **Running tests** - `npm run tests` from `packages/sdk/`
