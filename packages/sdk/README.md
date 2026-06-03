# statox-api

TypeScript SDK for `api.statox.fr`. Provides the `APIClient` factory and full type safety for all API endpoints.

## Structure

```
src/
├── client.ts          # APIClient factory, BaseAPIClient class, ApiError
├── generated/
│   └── routes.ts      # AUTO-GENERATED — schemas, types, and route modules
└── index.ts           # Package entry point
tests/
└── client.test.ts     # Unit tests for client.ts
```

## Source-only package (no build step)

This package ships TypeScript source directly. The `exports` field in `package.json` points at `./src/index.ts`, not a compiled `dist/` directory.

This is intentional for this private monorepo. Vite (used by the `front/` app) compiles TypeScript natively and resolves the package source through the `file:` symlink. There is no build step to run, no `dist/` to maintain, and no compilation required before consuming the package.

**Consequence:** this package cannot be published to npm as-is. Any future consumer outside of Vite would need either a build step or a bundler that handles TypeScript.

## Consuming the package (within this monorepo)

Add to `package.json` devDependencies:

```json
"statox-api": "file:../packages/sdk"
```

Then `npm install`. npm creates a symlink at `node_modules/statox-api → ../../packages/sdk`.

Import:

```ts
import { APIClient, ApiError } from 'statox-api';
import type { HomeTracker_GetDashboard_Output } from 'statox-api';

const client = APIClient({ baseURL: 'https://api.statox.fr' });
const data = await client.homeTracker.getDashboard();
```

## Call-time fetch options — `withOptions`

Some calls need fetch options that only apply to specific invocations. Rather than adding optional parameters to every generated method, `APIClient` exposes `withOptions`, which returns a one-shot modules proxy with the extra options merged into every underlying `fetch` call.

### keepalive — fire-and-forget telemetry

The browser cancels in-flight `fetch` requests when a page navigates away. Passing `keepalive: true` signals to the browser that it should complete the request even if the page unloads. This is the right tool for telemetry that fires on navigation (e.g. `webStats.record` in `beforeNavigate`).

```ts
// In a SvelteKit beforeNavigate callback
beforeNavigate(({ from }) => {
    client.withOptions({ keepalive: true }).webStats.record({
        clientTimestamp: Date.now(),
        app: 'apps.statox.fr',
        path: from?.url.pathname || 'N/A',
        action: 'navigated',
        clientId: 'my-client-id'
    });
});
```

`withOptions` returns the generated module namespace (same shape as `client.webStats`, `client.homeTracker`, etc.) but **not** a full `APIClient`. It is meant for single call-site use — do not store the result.

## Generated file

`src/generated/routes.ts` is committed to git. It contains:
- `schemas` — JSON schemas for all route inputs and outputs (used for runtime validation)
- TypeScript type aliases for all inputs, outputs, and error unions
- `buildModules(fetch)` — thin per-route arrow functions that call into `BaseAPIClient._fetch`

**To regenerate after a backend route change:**

```bash
cd back && npm run generate:sdk
```

The generator reads `back/src/libs/routes/index.ts` and writes `packages/sdk/src/generated/routes.ts`. Commit both the route change and the updated `routes.ts` together.

## Running tests

Install dependencies first (required for the TypeScript types and test runner):

```bash
cd packages/sdk && npm install
npm run tests
```

Tests cover `BaseAPIClient` directly (HTTP mechanics, error handling, auth headers, credentials). They do not depend on the generated `routes.ts`.

## Code quality

```bash
npm run check    # lint + prettier check
npm run lint
npm run prettier
```
