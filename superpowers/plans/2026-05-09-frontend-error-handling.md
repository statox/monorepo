# Frontend Error Handling Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the SDK throw a typed `ApiError` with string error codes, generate per-endpoint error union types, and fix critical missing error handling on the frontend.

**Architecture:** The SDK generator (`generateSDK.ts`) is updated to pass `clientErrors` from route definitions into the template. The `sdk.njk` template gains an `ApiError` class and a fixed `fetch` that parses the JSON error body instead of discarding it. The frontend re-exports `ApiError` from the vendor SDK so all existing call sites work without changing imports, then fixes error code comparisons and critical unhandled failures.

**Tech Stack:** TypeScript, Nunjucks (SDK template), Mocha + Chai (backend tests), SvelteKit 5 (frontend), Svelte 5 runes.

> **Note for agentic workers:** Backend tests run compiled output from `dist/`. Each task that modifies TypeScript files includes a `npm run build` step before running tests. If `npm run watch` is already running in a separate terminal, the build step can be skipped — the watcher compiles automatically.

---

## File Map

| File | What changes |
|---|---|
| `back/scripts/generateSDK.ts` | Add `clientErrors` to `GroupedRoute`; populate in `groupRoutes()`; add `AUTH_ERRORS` map + `generateErrorType()` helper; emit `_Errors` union types |
| `back/scripts/templates/sdk.njk` | Add `ApiError` class; fix `fetch` error branch + outer catch; tighten `onError` callback type |
| `back/tests/scripts/generateSDK.test.ts` | Tests for `clientErrors` passthrough, `_Errors` type generation, `ApiError` throwing behaviour |
| `front/src/vendor/statox-api/index.ts` | Re-generated — never edit by hand |
| `front/src/lib/api/errors.ts` | Replace body with re-export from vendor |
| `front/src/lib/components/FormLayout/formErrorHandler.ts` | `error.code === 401` → `error.code === 'UNAUTHORIZED'` |
| `front/src/lib/Songbook/service.ts` | Same numeric→string fix |
| `front/src/lib/PersonalTracker/service.ts` | Same numeric→string fix |
| `front/src/routes/(apps)/songbook/+page.ts` | Wrap load in try/catch with empty fallback |
| `front/src/routes/(apps)/songbook/edit/+page.ts` | Same |
| `front/src/routes/(apps)/gravitrips/2players/+page.svelte` | Add error state + try/catch to `getNewGameId` |
| `front/src/lib/auth/api.ts` | Show toast on `updateProfile` failure |

---

## Task 1: Add `clientErrors` field to `GroupedRoute` and `groupRoutes()`

**Files:**
- Modify: `back/scripts/generateSDK.ts:21-65`
- Test: `back/tests/scripts/generateSDK.test.ts`

- [ ] **Step 1.1: Write failing tests**

In `back/tests/scripts/generateSDK.test.ts`, inside the `describe('groupRoutes', ...)` block (after the last `it` at line 130), add:

```typescript
it('preserves clientErrors from route definition', () => {
    const route = {
        method: 'get',
        path: '/homeTracker/getDashboard',
        authentication: 'user2',
        scope: 'admin',
        outputSchema,
        clientErrors: ['ITEM_NOT_FOUND', 'ITEM_ALREADY_EXISTS']
    } as unknown as Route<unknown, unknown>;
    const grouped = groupRoutes([route]);
    const r = grouped.get('homeTracker')![0];
    assert.deepEqual(r.clientErrors, ['ITEM_NOT_FOUND', 'ITEM_ALREADY_EXISTS']);
});

it('defaults clientErrors to empty array when route has none', () => {
    const grouped = groupRoutes([getDashboardRoute]); // getDashboardRoute has no clientErrors
    const r = grouped.get('homeTracker')![0];
    assert.deepEqual(r.clientErrors, []);
});
```

- [ ] **Step 1.2: Build and run tests — confirm they fail**

```bash
cd /home/adrien/dev/monorepo/back && npm run build && npm run tests:scripts
```

Expected: both new tests fail with `TypeError: Cannot read properties of undefined (reading 'clientErrors')` or similar — `clientErrors` does not exist on `GroupedRoute` yet.

- [ ] **Step 1.3: Add `clientErrors` to `GroupedRoute` interface**

In `back/scripts/generateSDK.ts`, change the `GroupedRoute` interface (lines 21-29):

```typescript
interface GroupedRoute {
    module: string;
    name: string;
    method: 'get' | 'post';
    path: string;
    inputSchema?: ApiJsonSchema;
    outputSchema: ApiJsonSchema;
    authentication: string;
    clientErrors: string[];
}
```

- [ ] **Step 1.4: Populate `clientErrors` in `groupRoutes()`**

In `back/scripts/generateSDK.ts`, change the `groupedRoute` object literal (lines 57-65):

```typescript
const groupedRoute: GroupedRoute = {
    module,
    name,
    method: route.method,
    path: route.path,
    inputSchema: route.method === 'post' ? route.inputSchema : undefined,
    outputSchema: route.outputSchema,
    authentication: route.authentication,
    clientErrors: route.clientErrors ?? []
};
```

- [ ] **Step 1.5: Build and run tests — confirm they pass**

```bash
cd /home/adrien/dev/monorepo/back && npm run build && npm run tests:scripts
```

Expected: all tests pass.

- [ ] **Step 1.6: Commit**

```bash
git add back/scripts/generateSDK.ts back/tests/scripts/generateSDK.test.ts
git commit -m "sdk-gen - Add clientErrors field to GroupedRoute and groupRoutes()"
```

---

## Task 2: Generate per-endpoint `_Errors` union types

**Files:**
- Modify: `back/scripts/generateSDK.ts:145-178` (typeExports generation + new helpers)
- Test: `back/tests/scripts/generateSDK.test.ts`

- [ ] **Step 2.1: Write failing tests**

In `back/tests/scripts/generateSDK.test.ts`, inside `describe('generateSDK output', ...)`, after the last existing `it` block (around line 211), add:

```typescript
it('exports an _Errors union type for every endpoint', () => {
    assert.include(sdk, 'export type HomeTracker_GetDashboard_Errors =');
    assert.include(sdk, 'export type HomeTracker_AddEntry_Errors =');
    assert.include(sdk, 'export type Sensor_Data_Errors =');
});

it('user2 _Errors type includes UNAUTHORIZED, FORBIDDEN_FOR_USER, INVALID_SCOPE', () => {
    // getDashboardRoute and addEntryRoute are user2
    assert.include(sdk, "'UNAUTHORIZED'");
    assert.include(sdk, "'FORBIDDEN_FOR_USER'");
    assert.include(sdk, "'INVALID_SCOPE'");
});

it('apikey-iot _Errors type includes MISSING_API_KEY, INVALID_AUTH_HEADER, UNKNOWN_API_KEY', () => {
    // sensorDataRoute is apikey-iot
    assert.include(sdk, "'MISSING_API_KEY'");
    assert.include(sdk, "'INVALID_AUTH_HEADER'");
    assert.include(sdk, "'UNKNOWN_API_KEY'");
});

it('all _Errors types include INTERNAL_SERVER_ERROR and NETWORK_ERROR', () => {
    assert.include(sdk, "'INTERNAL_SERVER_ERROR'");
    assert.include(sdk, "'NETWORK_ERROR'");
});

it('clientErrors codes appear in _Errors union', () => {
    const routeWithErrors = {
        method: 'post',
        path: '/homeTracker/addEntry',
        authentication: 'user2',
        scope: 'admin',
        inputSchema,
        outputSchema,
        clientErrors: ['ITEM_NOT_FOUND', 'ITEM_ALREADY_EXISTS']
    } as unknown as Route<unknown, unknown>;
    const grouped = groupRoutes([routeWithErrors]);
    const sdkWithErrors = generateSDK(grouped);
    assert.include(sdkWithErrors, "'ITEM_NOT_FOUND'");
    assert.include(sdkWithErrors, "'ITEM_ALREADY_EXISTS'");
});
```

- [ ] **Step 2.2: Build and run tests — confirm they fail**

```bash
cd /home/adrien/dev/monorepo/back && npm run build && npm run tests:scripts
```

Expected: the 5 new tests fail with `AssertionError: expected '' to include 'export type HomeTracker_GetDashboard_Errors'`.

- [ ] **Step 2.3: Add `AUTH_ERRORS` map and `generateErrorType()` to `generateSDK.ts`**

In `back/scripts/generateSDK.ts`, add the following constant immediately before the `generateSDK` function (around line 76):

```typescript
const AUTH_ERRORS: Record<string, string[]> = {
    user2: ['UNAUTHORIZED', 'FORBIDDEN_FOR_USER', 'INVALID_SCOPE'],
    apikey: ['MISSING_API_KEY', 'INVALID_AUTH_HEADER', 'UNKNOWN_API_KEY'],
    'apikey-iot': ['MISSING_API_KEY', 'INVALID_AUTH_HEADER', 'UNKNOWN_API_KEY'],
    none: []
};
```

And add `generateErrorType` near the other helper functions at the bottom of the file (after `generateBundleType`):

```typescript
function generateErrorType(module: string, name: string): string {
    return `${capitalizeFirst(module)}_${capitalizeFirst(name)}_Errors`;
}
```

- [ ] **Step 2.4: Emit `_Errors` types in the `typeExports` flatMap**

In `back/scripts/generateSDK.ts`, the `typeExports` generation block (lines 145-170) contains an `if (route.inputSchema) { ... } else { ... }` block. After the closing brace of that `if/else`, before `return types;`, add:

```typescript
const errorType = generateErrorType(module, route.name);
const errorCodes = [
    ...route.clientErrors,
    ...(AUTH_ERRORS[route.authentication] ?? []),
    'INTERNAL_SERVER_ERROR',
    'NETWORK_ERROR'
];
const errorUnion = errorCodes.map((c) => `'${c}'`).join(' | ');
types.push(`export type ${errorType} = ${errorUnion};`);
```

The full updated `typeExports` block should look like:

```typescript
const typeExports = Array.from(groupedRoutes.entries())
    .flatMap(([module, routes]) =>
        routes.flatMap((route) => {
            const types: string[] = [];
            const outputType = generateNamedType(module, route.name, 'Output');
            const bundleType = generateBundleType(module, route.name);

            if (route.inputSchema) {
                const inputType = generateNamedType(module, route.name, 'Input');
                types.push(
                    `export type ${inputType} = FromSchema<typeof schemas.${module}_${route.name}_Input>;`
                );
                types.push(
                    `export type ${outputType} = FromSchema<typeof schemas.${module}_${route.name}_Output>;`
                );
                types.push(`export type ${bundleType} = Endpoint<${outputType}, ${inputType}>;`);
            } else {
                types.push(
                    `export type ${outputType} = FromSchema<typeof schemas.${module}_${route.name}_Output>;`
                );
                types.push(`export type ${bundleType} = Endpoint<${outputType}>;`);
            }

            const errorType = generateErrorType(module, route.name);
            const errorCodes = [
                ...route.clientErrors,
                ...(AUTH_ERRORS[route.authentication] ?? []),
                'INTERNAL_SERVER_ERROR',
                'NETWORK_ERROR'
            ];
            const errorUnion = errorCodes.map((c) => `'${c}'`).join(' | ');
            types.push(`export type ${errorType} = ${errorUnion};`);

            return types;
        })
    )
    .join('\n');
```

- [ ] **Step 2.5: Build and run tests — confirm they pass**

```bash
cd /home/adrien/dev/monorepo/back && npm run build && npm run tests:scripts
```

Expected: all tests pass.

- [ ] **Step 2.6: Commit**

```bash
git add back/scripts/generateSDK.ts back/tests/scripts/generateSDK.test.ts
git commit -m "sdk-gen - Emit per-endpoint _Errors union types"
```

---

## Task 3: Add `ApiError` class and fix `fetch` error handling in `sdk.njk`

**Files:**
- Modify: `back/scripts/templates/sdk.njk`
- Test: `back/tests/scripts/generateSDK.test.ts` (Runtime instantiation category)

- [ ] **Step 3.1: Write failing tests**

In `back/tests/scripts/generateSDK.test.ts`, inside `describe('Runtime instantiation', ...)`:

1. Update the variable declarations at the top of the describe block to add `ApiError`:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let APIClient: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ApiError: any;
let fetchStub: sinon.SinonStub;
```

2. Update the `before()` block's last line to also extract `ApiError`:

```typescript
APIClient = (moduleObj.exports as any).APIClient;
ApiError = (moduleObj.exports as any).ApiError;
```

3. Add these new tests after the last existing `it` block in the Runtime instantiation describe:

```typescript
it('throws ApiError with parsed code and httpStatus on HTTP error', async () => {
    fetchStub.resolves({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ httpStatus: 404, code: 'ITEM_NOT_FOUND', reason: 'No such item' })
    });

    const client = new APIClient({ baseURL: 'http://localhost:3000' });
    try {
        await client.homeTracker.getDashboard();
        assert.fail('Expected an error to be thrown');
    } catch (err) {
        assert.instanceOf(err, ApiError);
        assert.equal((err as any).httpStatus, 404);
        assert.equal((err as any).code, 'ITEM_NOT_FOUND');
        assert.equal((err as any).reason, 'No such item');
    }
});

it('throws ApiError with INTERNAL_SERVER_ERROR when body has no code', async () => {
    fetchStub.resolves({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({})
    });

    const client = new APIClient({ baseURL: 'http://localhost:3000' });
    try {
        await client.homeTracker.getDashboard();
        assert.fail('Expected an error to be thrown');
    } catch (err) {
        assert.instanceOf(err, ApiError);
        assert.equal((err as any).httpStatus, 500);
        assert.equal((err as any).code, 'INTERNAL_SERVER_ERROR');
        assert.isUndefined((err as any).reason);
    }
});

it('throws ApiError with NETWORK_ERROR code when fetch itself rejects', async () => {
    fetchStub.rejects(new Error('Network failure'));

    const client = new APIClient({ baseURL: 'http://localhost:3000' });
    try {
        await client.homeTracker.getDashboard();
        assert.fail('Expected an error to be thrown');
    } catch (err) {
        assert.instanceOf(err, ApiError);
        assert.equal((err as any).code, 'NETWORK_ERROR');
        assert.equal((err as any).httpStatus, 0);
    }
});

it('calls onError callback with ApiError on HTTP error', async () => {
    fetchStub.resolves({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ httpStatus: 401, code: 'UNAUTHORIZED' })
    });

    const onErrorStub = sinon.stub();
    const client = new APIClient({ baseURL: 'http://localhost:3000', onError: onErrorStub });
    try {
        await client.homeTracker.getDashboard();
    } catch {
        /* expected */
    }
    assert.isTrue(onErrorStub.calledOnce);
    assert.instanceOf(onErrorStub.firstCall.args[0], ApiError);
    assert.equal(onErrorStub.firstCall.args[0].code, 'UNAUTHORIZED');
});
```

- [ ] **Step 3.2: Build and run tests — confirm they fail**

```bash
cd /home/adrien/dev/monorepo/back && npm run build && npm run tests:scripts
```

Expected: the 4 new tests fail because `ApiError` is undefined and `err` is a plain `Error`.

- [ ] **Step 3.3: Add `ApiError` class to `sdk.njk`**

In `back/scripts/templates/sdk.njk`, after the `validateOutput` function block (after line 41 in the current file, which ends with the closing `}` of `validateOutput`) and before the `type AuthType = ...` line, insert:

```typescript
export class ApiError<TCode extends string = string> extends Error {
    readonly httpStatus: number;
    readonly code: TCode;
    readonly reason?: string;

    constructor(httpStatus: number, code: TCode, reason?: string) {
        super(code);
        this.name = 'ApiError';
        this.httpStatus = httpStatus;
        this.code = code;
        this.reason = reason;
    }
}

```

- [ ] **Step 3.4: Update `APIClientConfig.onError` and `APIClient` field type**

In `back/scripts/templates/sdk.njk`, change the `APIClientConfig` interface:

```typescript
// API Client
export interface APIClientConfig {
    baseURL: string;
    apiKey?: string;
    onError?: (error: ApiError, endpoint: string) => void;
}

export class APIClient {
    private baseURL: string;
    private apiKey?: string;
    private onError?: (error: ApiError, endpoint: string) => void;
```

- [ ] **Step 3.5: Fix the `!response.ok` error branch in `fetch`**

In `back/scripts/templates/sdk.njk`, replace the current `!response.ok` block:

```typescript
            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                this.onError?.(error, path);
                throw error;
            }
```

With:

```typescript
            if (!response.ok) {
                let code = 'INTERNAL_SERVER_ERROR';
                let reason: string | undefined;
                try {
                    const body = await response.json();
                    if (typeof body?.code === 'string') code = body.code;
                    if (typeof body?.reason === 'string') reason = body.reason;
                } catch { /* body was not JSON */ }
                const error = new ApiError(response.status, code, reason);
                this.onError?.(error, path);
                throw error;
            }
```

- [ ] **Step 3.6: Fix the outer `catch` block**

In `back/scripts/templates/sdk.njk`, replace the current outer catch:

```typescript
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.onError?.(err, path);
            throw err;
        }
```

With:

```typescript
        } catch (error) {
            if (error instanceof ApiError) throw error;
            const err = new ApiError(0, 'NETWORK_ERROR', String(error));
            this.onError?.(err, path);
            throw err;
        }
```

- [ ] **Step 3.7: Build and run tests — confirm they pass**

```bash
cd /home/adrien/dev/monorepo/back && npm run build && npm run tests:scripts
```

Expected: all tests pass including the 4 new ones.

- [ ] **Step 3.8: Run lint check**

```bash
cd /home/adrien/dev/monorepo/back && npm run check
```

Expected: no errors.

- [ ] **Step 3.9: Commit**

```bash
git add back/scripts/templates/sdk.njk back/tests/scripts/generateSDK.test.ts
git commit -m "sdk-gen - Add ApiError class and fix fetch error handling in template"
```

---

## Task 4: Regenerate the SDK and verify

**Files:**
- Modify: `front/src/vendor/statox-api/index.ts` (re-generated)

- [ ] **Step 4.1: Rebuild the backend TypeScript**

```bash
cd /home/adrien/dev/monorepo/back && npm run build
```

Expected: TypeScript compiles without errors, `dist/` updated.

- [ ] **Step 4.2: Run the SDK generator**

```bash
cd /home/adrien/dev/monorepo/back && npm run generate:sdk
```

Expected: `front/src/vendor/statox-api/index.ts` is regenerated. Output shows route count and module list.

- [ ] **Step 4.3: Verify `ApiError` class is in the generated file**

```bash
grep -n "class ApiError" /home/adrien/dev/monorepo/front/src/vendor/statox-api/index.ts
```

Expected: one match showing `export class ApiError<TCode extends string = string> extends Error {`

- [ ] **Step 4.4: Verify `_Errors` types are generated**

```bash
grep -c "_Errors" /home/adrien/dev/monorepo/front/src/vendor/statox-api/index.ts
```

Expected: count > 0 (one `_Errors` type per endpoint).

- [ ] **Step 4.5: Spot-check a specific error union**

```bash
grep "Clipboard_AddEntry_Errors" /home/adrien/dev/monorepo/front/src/vendor/statox-api/index.ts
```

Expected: something like `export type Clipboard_AddEntry_Errors = 'FILE_OR_CONTENT_REQUIRED' | 'ITEM_ALREADY_EXISTS' | 'UNAUTHORIZED' | 'FORBIDDEN_FOR_USER' | 'INVALID_SCOPE' | 'INTERNAL_SERVER_ERROR' | 'NETWORK_ERROR';`

- [ ] **Step 4.6: Commit**

```bash
git add front/src/vendor/statox-api/index.ts
git commit -m "sdk - Regenerate with ApiError class and _Errors union types"
```

---

## Task 5: Re-export `ApiError` from vendor SDK and fix error code comparisons

These two changes must be done together: replacing `errors.ts` changes `ApiError.code` from
`number` to `string`, which makes the existing `=== 401` comparisons type errors. Fixing both
in one commit keeps the TypeScript check green.

**Files:**
- Modify: `front/src/lib/api/errors.ts`
- Modify: `front/src/lib/components/FormLayout/formErrorHandler.ts:8`
- Modify: `front/src/lib/Songbook/service.ts:72`
- Modify: `front/src/lib/PersonalTracker/service.ts:112`

- [ ] **Step 5.1: Replace `errors.ts` with a re-export**

`front/src/lib/api/errors.ts` currently defines:
```typescript
export class ApiError extends Error {
    code: number;
    constructor(code: number, message: string) {
        super(message);
        this.code = code;
    }
}
```

Replace the entire file with:

```typescript
export { ApiError } from '$vendor/statox-api';
```

`front/src/lib/api/index.ts` exports `* from './errors'` — no change needed there. All existing imports `from '$lib/api'` continue to resolve to the SDK's `ApiError`.

- [ ] **Step 5.2: Fix `formErrorHandler.ts`**

In `front/src/lib/components/FormLayout/formErrorHandler.ts`, change line 8:

```typescript
// Before
if (error instanceof ApiError && error.code === 401) {

// After
if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
```

- [ ] **Step 5.3: Fix `Songbook/service.ts`**

In `front/src/lib/Songbook/service.ts`, change line 72:

```typescript
// Before
if (error instanceof ApiError && error.code === 401) {

// After
if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
```

- [ ] **Step 5.4: Fix `PersonalTracker/service.ts`**

In `front/src/lib/PersonalTracker/service.ts`, change line 112:

```typescript
// Before
if (error instanceof ApiError && error.code === 401) {

// After
if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
```

- [ ] **Step 5.5: Run frontend TypeScript check**

```bash
cd /home/adrien/dev/monorepo/front && npm run check
```

Expected: no errors.

- [ ] **Step 5.6: Commit**

```bash
git add front/src/lib/api/errors.ts \
        front/src/lib/components/FormLayout/formErrorHandler.ts \
        front/src/lib/Songbook/service.ts \
        front/src/lib/PersonalTracker/service.ts
git commit -m "front - Re-export ApiError from vendor SDK and fix UNAUTHORIZED code comparisons"
```

---

## Task 6: Fix missing error handling in Songbook page load functions

**Files:**
- Modify: `front/src/routes/(apps)/songbook/+page.ts`
- Modify: `front/src/routes/(apps)/songbook/edit/+page.ts`

Both files currently have no try/catch in their `load` functions. If the API call fails, SvelteKit renders its default crash page. The fix returns an empty fallback state instead.

- [ ] **Step 6.1: Fix `songbook/+page.ts`**

Replace the entire file with:

```typescript
import { getSongbook, type Chord } from '$lib/Songbook';
import type { PageLoad } from './$types';

export const ssr = false; // Avoid calling API's /chords/getAll at build time
export const load: PageLoad = async (): Promise<{ chords: Chord[] }> => {
    try {
        const chords = await getSongbook();
        return { chords };
    } catch {
        return { chords: [] };
    }
};
```

- [ ] **Step 6.2: Fix `songbook/edit/+page.ts`**

Replace the entire file with:

```typescript
import { getChords, type RawChord } from '$lib/Songbook';
import type { PageLoad } from './$types';

export const ssr = false; // Avoid calling API's /chords/getAll at build time
export const load: PageLoad = async (): Promise<{ chords: RawChord[] }> => {
    try {
        const chords = await getChords();
        return { chords };
    } catch {
        return { chords: [] };
    }
};
```

- [ ] **Step 6.3: Run frontend TypeScript check**

```bash
cd /home/adrien/dev/monorepo/front && npm run check
```

Expected: no errors.

- [ ] **Step 6.4: Commit**

```bash
git add front/src/routes/\(apps\)/songbook/+page.ts \
        front/src/routes/\(apps\)/songbook/edit/+page.ts
git commit -m "front - Wrap songbook page load functions in try/catch with empty fallback"
```

---

## Task 7: Fix missing error handling in Gravitrips `getNewGameId`

**Files:**
- Modify: `front/src/routes/(apps)/gravitrips/2players/+page.svelte`

The `getNewGameId` function is called via `onclick={getNewGameId}`. Any thrown error is silently dropped by the DOM event handler. Add a reactive error state and wrap in try/catch.

- [ ] **Step 7.1: Add error state and wrap `getNewGameId` in try/catch**

In `front/src/routes/(apps)/gravitrips/2players/+page.svelte`, in the `<script>` block, replace the current `getNewGameId` function:

```typescript
// BEFORE (lines 35-42)
const getNewGameId = async () => {
    const res = await client2.gravitrips.getNewGame();
    if (!res.gameId) {
        throw new Error("Couldn't start the game");
    }
    gameId = res.gameId;
    startGame();
};
```

With:

```typescript
let getGameError: string | null = $state(null);

const getNewGameId = async () => {
    getGameError = null;
    try {
        const res = await client2.gravitrips.getNewGame();
        if (!res.gameId) {
            getGameError = "Server returned no game ID";
            return;
        }
        gameId = res.gameId;
        startGame();
    } catch (error) {
        getGameError = (error as Error).message || 'Failed to start game';
    }
};
```

The `let gameId = $state('');` declaration is already on the line before `getNewGameId`, so `let getGameError` should be inserted just before the `getNewGameId` const.

- [ ] **Step 7.2: Show the error in the template**

In `front/src/routes/(apps)/gravitrips/2players/+page.svelte`, in the HTML template section, after the "Start a new game" button block (after the `{#if [...].includes(pageState)}` block, around line 114), add:

```svelte
{#if getGameError}
    <p style="color: red">{getGameError}</p>
{/if}
```

- [ ] **Step 7.3: Run frontend TypeScript check**

```bash
cd /home/adrien/dev/monorepo/front && npm run check
```

Expected: no errors.

- [ ] **Step 7.4: Commit**

```bash
git add "front/src/routes/(apps)/gravitrips/2players/+page.svelte"
git commit -m "front - Add error handling to gravitrips getNewGameId"
```

---

## Task 8: Fix silent failure in `auth/api.ts:updateProfile()`

**Files:**
- Modify: `front/src/lib/auth/api.ts`

Currently the `catch` block in `updateProfile` silently calls `logoutCleanup()` with no user feedback. Add a toast notification so the user knows a network error occurred.

- [ ] **Step 8.1: Add toast import and error feedback**

Replace the entire `front/src/lib/auth/api.ts` with:

```typescript
import { client2 } from '$lib/api';
import { toast } from '$lib/components/Toast';
import { personalTrackerPassword } from '$lib/PersonalTracker';
import { user } from './store';

export const getProfile = client2.auth.me;

export const login = async (username: string, password: string) => {
    await client2.auth.login({ username, password });
    await updateProfile();
};

export const logout = async () => {
    await client2.auth.logout({});
    await updateProfile();
};

const logoutCleanup = () => {
    console.log('Clean up user data');
    personalTrackerPassword.clearPassword();
    user.set(undefined);
};

export const updateProfile = async () => {
    try {
        const profile = await getProfile({});
        if (profile.status === 'logged_in') {
            user.set(profile);
            return;
        }
        logoutCleanup();
    } catch (error) {
        logoutCleanup();
        toast.push(`<strong>Session error</strong><br/>${(error as Error).message}`, {
            duration: 5000,
            theme: { '--toastBarBackground': '#FF0000' }
        });
    }
};
```

- [ ] **Step 8.2: Run frontend TypeScript check**

```bash
cd /home/adrien/dev/monorepo/front && npm run check
```

Expected: no errors.

- [ ] **Step 8.3: Commit**

```bash
git add front/src/lib/auth/api.ts
git commit -m "front - Show toast on updateProfile network failure"
```

---

## Task 9: Final verification

- [ ] **Step 9.1: Run all backend test suites**

```bash
cd /home/adrien/dev/monorepo/back && npm run tests:all
```

Expected: all suites pass (packages, scripts, framework, routes).

- [ ] **Step 9.2: Run frontend lint and type check**

```bash
cd /home/adrien/dev/monorepo/front && npm run check && npm run lint
```

Expected: no errors.

- [ ] **Step 9.3: Verify the generated SDK compiles as a TypeScript module**

```bash
grep -c "class ApiError" /home/adrien/dev/monorepo/front/src/vendor/statox-api/index.ts
grep -c "_Errors" /home/adrien/dev/monorepo/front/src/vendor/statox-api/index.ts
```

Expected: both counts > 0.

- [ ] **Step 9.4: Verify `instanceof ApiError` is now live**

```bash
grep -n "instanceof ApiError" /home/adrien/dev/monorepo/front/src/lib/components/FormLayout/formErrorHandler.ts \
     /home/adrien/dev/monorepo/front/src/lib/Songbook/service.ts \
     /home/adrien/dev/monorepo/front/src/lib/PersonalTracker/service.ts
```

Expected: 3 matches. Each check now works because `ApiError` is the same class the SDK throws.
