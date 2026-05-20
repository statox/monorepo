# SDK Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the SDK from a Nunjucks-template code-generation system to a proper TypeScript package at `packages/sdk/` where all client logic lives as real `.ts` files and the generator produces only a data+routes file.

**Architecture:** `packages/sdk/src/client.ts` holds `BaseAPIClient`, `ApiError`, and an `APIClient` factory function. The generator writes `packages/sdk/src/generated/routes.ts` containing the `schemas` const, TypeScript type exports, and a `buildModules(fetch)` function with thin per-route arrow functions. The `APIClient` factory combines `BaseAPIClient` with the generated modules at construction time. The frontend installs the package via `"statox-api": "file:../packages/sdk"` and Vite compiles the TypeScript source directly — no build step in the package.

**Tech Stack:** TypeScript (nodenext), Mocha + Chai + Sinon (tests), ESLint + Prettier (same config as back/), tsx (mocha loader), ajv (runtime validation), json-schema-to-ts (types only).

---

## File Map

**Create:**
- `packages/sdk/package.json`
- `packages/sdk/tsconfig.json`
- `packages/sdk/eslint.config.mjs`
- `packages/sdk/.prettierrc`
- `packages/sdk/.gitignore`
- `packages/sdk/tests/mocha/sdk.json`
- `packages/sdk/tests/client.test.ts`
- `packages/sdk/src/types.ts` — `AuthType`, `Endpoint`, `FetchFn` shared between `client.ts` and generated code
- `packages/sdk/src/client.ts`
- `packages/sdk/src/generated/routes.ts` (placeholder, then overwritten by generator)
- `packages/sdk/src/index.ts`
- `packages/sdk/README.md`

**Modify:**
- `back/scripts/templates/sdk.njk` — replace full-SDK template with routes.ts template
- `back/scripts/templates/route.njk` — update route method template for `buildModules` style
- `back/scripts/generateSDK.ts` — change output filename from `index.ts` to `routes.ts`
- `back/package.json` — update `generate:sdk` script path
- `back/tests/scripts/generateSDK.test.ts` — update category 2 assertions, remove category 4
- `front/package.json` — add `"statox-api": "file:../packages/sdk"` to devDependencies
- `front/src/lib/api/client2.ts` — change import and remove `new`
- `front/src/lib/api/errors.ts` — change import path
- `front/src/lib/HomeTracker/service.ts` — change import path
- `front/src/routes/(apps)/songbook/edit/+page.svelte` — change import path
- `front/svelte.config.js` — remove `$vendor` alias

**Delete:**
- `front/src/vendor/statox-api/index.ts`

---

## Task 1: Scaffold `packages/sdk`

**Files:**
- Create: `packages/sdk/package.json`
- Create: `packages/sdk/tsconfig.json`
- Create: `packages/sdk/eslint.config.mjs`
- Create: `packages/sdk/.prettierrc`
- Create: `packages/sdk/.gitignore`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p packages/sdk/src/generated packages/sdk/tests/mocha
```

- [ ] **Step 2: Create `packages/sdk/package.json`**

```json
{
    "name": "statox-api",
    "version": "1",
    "type": "module",
    "exports": {
        ".": "./src/index.ts"
    },
    "scripts": {
        "check": "npm run lint && npm run prettier",
        "lint": "eslint",
        "prettier": "prettier --check 'src/**/*.ts' 'tests/**/*.ts'",
        "prettier:fix": "prettier --write 'src/**/*.ts' 'tests/**/*.ts'",
        "tests": "mocha --config tests/mocha/sdk.json"
    },
    "dependencies": {
        "ajv": "^8.20.0"
    },
    "devDependencies": {
        "@eslint/eslintrc": "^3.3.5",
        "@eslint/js": "^10.0.1",
        "@typescript-eslint/eslint-plugin": "^8.59.3",
        "@typescript-eslint/parser": "^8.32.1",
        "@types/chai": "^5.2.3",
        "@types/mocha": "^10.0.10",
        "@types/sinon": "^21.0.1",
        "chai": "^6.2.2",
        "eslint": "^10.3.0",
        "eslint-config-prettier": "^10.1.8",
        "globals": "^17.6.0",
        "json-schema-to-ts": "^3.1.1",
        "mocha": "^11.7.5",
        "prettier": "^3.8.3",
        "sinon": "^22.0.0",
        "tsx": "^4.19.2",
        "typescript": "^6.0.3"
    }
}
```

- [ ] **Step 3: Create `packages/sdk/tsconfig.json`**

```json
{
    "compilerOptions": {
        "allowJs": true,
        "checkJs": true,
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "lib": ["es2023"],
        "module": "nodenext",
        "moduleResolution": "nodenext",
        "skipLibCheck": true,
        "strict": true,
        "target": "es2022"
    }
}
```

- [ ] **Step 4: Create `packages/sdk/eslint.config.mjs`**

Copy from `back/eslint.config.mjs`. The `ignores` block can omit `dist/**` since there is no build output.

```js
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    ...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'),
    {
        plugins: {
            '@typescript-eslint': typescriptEslint
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            },
            parser: tsParser,
            ecmaVersion: 2020,
            sourceType: 'module'
        },
        rules: {
            'require-await': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { caughtErrorsIgnorePattern: '^_' }
            ]
        }
    }
];
```

- [ ] **Step 5: Create `packages/sdk/.prettierrc`** (copy exactly from `back/.prettierrc`)

```json
{
    "useTabs": false,
    "tabWidth": 4,
    "singleQuote": true,
    "trailingComma": "none",
    "printWidth": 100
}
```

- [ ] **Step 6: Create `packages/sdk/.gitignore`**

```
node_modules/
```

- [ ] **Step 7: Create `packages/sdk/tests/mocha/sdk.json`**

```json
{
    "spec": "tests/**/*.test.ts",
    "node-option": ["import=tsx"],
    "exit": true,
    "timeout": 10000,
    "parallel": false,
    "jobs": 1
}
```

- [ ] **Step 8: Run `npm install` in `packages/sdk`**

```bash
cd packages/sdk && npm install
```

Expected: `node_modules/` populated, no errors.

- [ ] **Step 9: Commit**

```bash
git add packages/sdk/
git commit -m "chore: scaffold packages/sdk package structure"
```

---

## Task 2: Implement `BaseAPIClient` with TDD

**Files:**
- Create: `packages/sdk/src/types.ts`
- Create: `packages/sdk/tests/client.test.ts`
- Create: `packages/sdk/src/generated/routes.ts` (placeholder)
- Create: `packages/sdk/src/client.ts`
- Create: `packages/sdk/src/index.ts`

- [ ] **Step 1: Create `packages/sdk/src/types.ts`**

These three types are shared between `client.ts` (static code) and `generated/routes.ts` (generated code). Keeping them here avoids embedding infrastructure TypeScript inside a Nunjucks template and prevents a circular import (`client.ts` → `generated/routes.ts` → `types.ts`, no cycle).

```ts
import type { AnySchema } from 'ajv';

export type AuthType = 'none' | 'user2' | 'apikey-iot' | 'apikey';

export interface Endpoint<TOutput, TBody = null> {
    output: TOutput;
    body: TBody;
}

export type FetchFn = (
    path: string,
    body: null | unknown,
    validation: { inputSchema?: AnySchema; outputSchema: AnySchema; endpoint: string },
    options: { method: 'GET' | 'POST' },
    auth: { type: AuthType }
) => Promise<unknown>;
```

- [ ] **Step 2: Create the placeholder `packages/sdk/src/generated/routes.ts`**

This file must exist for `client.ts` to compile. It will be overwritten by the generator in Task 4.

```ts
// AUTO-GENERATED - do not edit. Run: cd back && npm run generate:sdk
import type { FetchFn } from '../types.js';

export function buildModules(_fetch: FetchFn) {
    return {};
}
```

- [ ] **Step 4: Write `packages/sdk/tests/client.test.ts`**

```ts
import { assert } from 'chai';
import sinon from 'sinon';
import type { AnySchema } from 'ajv';
import { BaseAPIClient, ApiError } from '../src/client.js';

const outputSchema: AnySchema = {
    type: 'object',
    properties: { result: { type: 'string' } },
    required: ['result'],
    additionalProperties: false
};

const inputSchema: AnySchema = {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
    additionalProperties: false
};

const validation = { outputSchema, endpoint: 'test.endpoint' };

function makeClient(
    extra: Partial<{
        apiKey: string;
        onError: (e: ApiError, path: string) => void;
    }> = {}
) {
    const fetchStub = sinon.stub<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
    const client = new BaseAPIClient({
        baseURL: 'http://localhost:3000',
        fetcher: fetchStub as unknown as typeof fetch,
        ...extra
    });
    return { client, fetchStub };
}

describe('BaseAPIClient', () => {
    it('can be instantiated', () => {
        const { client } = makeClient();
        assert.ok(client);
    });

    it('GET call uses correct URL and method', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({ result: 'test' })
        } as Response);

        await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'none' });

        const [url, opts] = fetchStub.firstCall.args;
        assert.equal(url, 'http://localhost:3000/test/get');
        assert.equal((opts as RequestInit).method, 'GET');
    });

    it('strips trailing slash from baseURL', async () => {
        const fetchStub = sinon.stub<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({ result: 'test' })
        } as Response);
        const client = new BaseAPIClient({
            baseURL: 'http://localhost:3000/',
            fetcher: fetchStub as unknown as typeof fetch
        });

        await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'none' });

        const [url] = fetchStub.firstCall.args;
        assert.equal(url, 'http://localhost:3000/test/get');
    });

    it('POST call sends JSON body and Content-Type header', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({ result: 'ok' })
        } as Response);

        await client._fetch(
            '/test/post',
            { name: 'test' },
            { inputSchema, outputSchema, endpoint: 'test.post' },
            { method: 'POST' },
            { type: 'none' }
        );

        const [, opts] = fetchStub.firstCall.args;
        const headers = (opts as RequestInit & { headers: Record<string, string> }).headers;
        assert.equal(headers['Content-Type'], 'application/json');
        assert.equal((opts as RequestInit).body, JSON.stringify({ name: 'test' }));
    });

    it('POST call validates input before calling fetch', async () => {
        const { client, fetchStub } = makeClient();

        try {
            await client._fetch(
                '/test/post',
                { invalid: true },
                { inputSchema, outputSchema, endpoint: 'test.post' },
                { method: 'POST' },
                { type: 'none' }
            );
            assert.fail('Expected error');
        } catch (err) {
            assert.include((err as Error).message, 'Invalid input');
            assert.equal(fetchStub.callCount, 0);
        }
    });

    it('warns on output schema mismatch without throwing', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({}) // missing required 'result'
        } as Response);

        const warnStub = sinon.stub(console, 'warn');
        try {
            await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'none' });
            assert.isTrue(warnStub.calledOnce);
        } finally {
            warnStub.restore();
        }
    });

    it('user2 auth sends credentials: include', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({ result: 'test' })
        } as Response);

        await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'user2' });

        const [, opts] = fetchStub.firstCall.args;
        assert.equal((opts as RequestInit).credentials, 'include');
    });

    it('non-user2 auth sends credentials: omit', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({ result: 'test' })
        } as Response);

        await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'none' });

        const [, opts] = fetchStub.firstCall.args;
        assert.equal((opts as RequestInit).credentials, 'omit');
    });

    it('apikey-iot auth sends Authorization header when apiKey configured', async () => {
        const { client, fetchStub } = makeClient({ apiKey: 'my-key' });
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({ result: 'test' })
        } as Response);

        await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'apikey-iot' });

        const [, opts] = fetchStub.firstCall.args;
        const headers = (opts as RequestInit & { headers: Record<string, string> }).headers;
        assert.equal(headers['Authorization'], 'Bearer my-key');
    });

    it('apikey-iot auth omits Authorization header when no apiKey', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({ result: 'test' })
        } as Response);

        await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'apikey-iot' });

        const [, opts] = fetchStub.firstCall.args;
        const headers = (opts as RequestInit & { headers: Record<string, string> }).headers;
        assert.isUndefined(headers['Authorization']);
    });

    it('throws ApiError with code and httpStatus on HTTP error', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.resolves({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ httpStatus: 404, code: 'ITEM_NOT_FOUND', reason: 'No item' })
        } as Response);

        try {
            await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'none' });
            assert.fail('Expected error');
        } catch (err) {
            assert.instanceOf(err, ApiError);
            assert.propertyVal(err as object, 'httpStatus', 404);
            assert.propertyVal(err as object, 'code', 'ITEM_NOT_FOUND');
            assert.propertyVal(err as object, 'reason', 'No item');
        }
    });

    it('throws ApiError with INTERNAL_SERVER_ERROR when response body has no code', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.resolves({
            ok: false,
            status: 500,
            json: () => Promise.resolve({})
        } as Response);

        try {
            await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'none' });
            assert.fail('Expected error');
        } catch (err) {
            assert.instanceOf(err, ApiError);
            assert.propertyVal(err as object, 'httpStatus', 500);
            assert.propertyVal(err as object, 'code', 'INTERNAL_SERVER_ERROR');
        }
    });

    it('throws ApiError with NETWORK_ERROR when fetch rejects', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.rejects(new Error('Network failure'));

        try {
            await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'none' });
            assert.fail('Expected error');
        } catch (err) {
            assert.instanceOf(err, ApiError);
            assert.propertyVal(err as object, 'code', 'NETWORK_ERROR');
            assert.propertyVal(err as object, 'httpStatus', 0);
        }
    });

    it('calls onError callback on HTTP error', async () => {
        const onError = sinon.stub();
        const { client, fetchStub } = makeClient({ onError });
        fetchStub.resolves({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ code: 'UNAUTHORIZED' })
        } as Response);

        try {
            await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'user2' });
        } catch { /* expected */ }

        assert.isTrue(onError.calledOnce);
        assert.instanceOf(onError.firstCall.args[0], ApiError);
        assert.propertyVal(onError.firstCall.args[0] as object, 'code', 'UNAUTHORIZED');
    });
});
```

- [ ] **Step 5: Run tests — expect failures (client.ts doesn't exist yet)**

```bash
cd packages/sdk && npm run tests
```

Expected: errors like `Cannot find module '../src/client.js'`.

- [ ] **Step 6: Create `packages/sdk/src/client.ts`**

```ts
import Ajv, { type AnySchema, type ValidateFunction } from 'ajv';
import { buildModules } from './generated/routes.js';
import type { AuthType } from './types.js';

const ajv = new Ajv();
const validators: Map<string, ValidateFunction> = new Map();

function getValidator(schema: AnySchema, key: string): ValidateFunction {
    if (!validators.has(key)) {
        validators.set(key, ajv.compile(schema));
    }
    return validators.get(key)!;
}

function validateInput(schema: AnySchema, data: unknown, endpoint: string): void {
    const validator = getValidator(schema, `input_${endpoint}`);
    if (!validator(data)) {
        throw new Error(`Invalid input for ${endpoint}: ${ajv.errorsText(validator.errors)}`);
    }
}

function validateOutput(schema: AnySchema, data: unknown, endpoint: string): void {
    const validator = getValidator(schema, `output_${endpoint}`);
    if (!validator(data)) {
        console.warn(`Invalid output for ${endpoint}: ${ajv.errorsText(validator.errors)}`);
    }
}

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

export interface APIClientConfig {
    baseURL: string;
    apiKey?: string;
    onError?: (error: ApiError, endpoint: string) => void;
    // Injecting fetch is the test seam — in production this defaults to globalThis.fetch.
    // Avoids monkey-patching globalThis which is fragile in ESM test environments.
    fetcher?: typeof globalThis.fetch;
}

export class BaseAPIClient {
    private baseURL: string;
    private apiKey?: string;
    private onError?: (error: ApiError, endpoint: string) => void;
    private fetcher: typeof globalThis.fetch;

    constructor(config: APIClientConfig) {
        this.baseURL = config.baseURL.replace(/\/$/, '');
        this.apiKey = config.apiKey;
        this.onError = config.onError;
        this.fetcher = config.fetcher ?? globalThis.fetch;
    }

    // Public (not private) so the APIClient factory below can pass it as a callback
    // to buildModules without needing subclass tricks. The _ prefix signals "internal —
    // do not call from application code."
    async _fetch(
        path: string,
        body: null | unknown,
        validation: { inputSchema?: AnySchema; outputSchema: AnySchema; endpoint: string },
        options: { method: 'GET' | 'POST' },
        auth: { type: AuthType }
    ): Promise<unknown> {
        const bodyIsDefined = body !== null;
        if (bodyIsDefined) {
            if (!validation.inputSchema) {
                throw new Error('Missing input schema');
            }
            validateInput(validation.inputSchema, body, validation.endpoint);
        }

        const url = `${this.baseURL}${path}`;
        const headers: Record<string, string> = {};

        if (bodyIsDefined) {
            headers['Content-Type'] = 'application/json';
        }
        if ((auth.type === 'apikey' || auth.type === 'apikey-iot') && this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        try {
            const response = await this.fetcher(url, {
                method: options.method,
                headers,
                body: bodyIsDefined ? JSON.stringify(body) : undefined,
                mode: 'cors',
                credentials: auth.type === 'user2' ? 'include' : 'omit'
            });

            if (!response.ok) {
                let code = 'INTERNAL_SERVER_ERROR';
                let reason: string | undefined;
                try {
                    const responseBody = await response.json();
                    if (typeof responseBody?.code === 'string') code = responseBody.code;
                    if (typeof responseBody?.reason === 'string') reason = responseBody.reason;
                } catch { /* body was not JSON */ }
                const error = new ApiError(response.status, code, reason);
                this.onError?.(error, path);
                throw error;
            }

            const output = await response.json();
            validateOutput(validation.outputSchema, output, validation.endpoint);
            return output;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            const err = new ApiError(0, 'NETWORK_ERROR', String(error));
            this.onError?.(err, path);
            throw err;
        }
    }
}

// Factory function (not a class) so we can return BaseAPIClient & the generated modules
// as a single typed value without declaration-merging gymnastics.
// Object.assign merges the route module objects (homeTracker, auth, …) returned by
// buildModules onto the BaseAPIClient instance at runtime. TypeScript infers the
// combined type from ReturnType<typeof APIClient>.
// The arrow wrapper (p, b, v, o, a) => base._fetch(p, b, v, o, a) captures `base` in a
// closure so the generated route methods always call the correct instance's _fetch even
// if the returned object is spread or partially destructured.
export function APIClient(config: APIClientConfig) {
    const base = new BaseAPIClient(config);
    return Object.assign(base, buildModules((p, b, v, o, a) => base._fetch(p, b, v, o, a)));
}

// Type alias so callers can annotate variables: `let client: APIClient`
export type APIClient = ReturnType<typeof APIClient>;
```

- [ ] **Step 7: Create `packages/sdk/src/index.ts`**

```ts
export { APIClient, BaseAPIClient, ApiError, type APIClientConfig } from './client.js';
export * from './generated/routes.js';
```

- [ ] **Step 8: Run tests — expect all passing**

```bash
cd packages/sdk && npm run tests
```

Expected: all 13 tests pass.

- [ ] **Step 9: Run lint and prettier**

```bash
cd packages/sdk && npm run check
```

Fix any issues.

- [ ] **Step 10: Commit**

```bash
git add packages/sdk/src/ packages/sdk/tests/
git commit -m "feat: add packages/sdk with BaseAPIClient, ApiError, and tests"
```

---

## Task 3: Update the generator tests to assert new output format

**Files:**
- Modify: `back/tests/scripts/generateSDK.test.ts`

The test has 4 categories. Categories 1 (groupRoutes) stay unchanged. Category 2 (output assertions) needs updating. Category 3 (transpilation) needs a minor update. Category 4 (runtime instantiation) is removed — it is superseded by packages/sdk/tests/client.test.ts.

- [ ] **Step 1: Update category 2 tests in `back/tests/scripts/generateSDK.test.ts`**

Find and apply these changes inside the `describe('generateSDK output', ...)` block:

**Test to remove:**
```ts
// DELETE this test entirely — it checked for no validateInput call, which is
// now an implementation detail of client.ts, not part of the generated output.
it('GET method passes null as body (skipping inline validation)', () => {
    assert.notInclude(sdk, 'validateInput(schemas.homeTracker_getDashboard_');
});
```

**Add in its place:**
```ts
it('GET method passes null as the body argument to fetch', () => {
    assert.include(sdk, "fetch('/homeTracker/getDashboard', null,");
});
```

**Update the authentication JSDoc test** (the route comment format changed):
```ts
// OLD:
it('authentication value appears in JSDoc for each route', () => {
    assert.include(sdk, '* Authentication: user2');
    assert.include(sdk, '* Authentication: apikey-iot');
});

// NEW:
it('authentication type appears in route comment', () => {
    assert.include(sdk, '– auth: user2');
    assert.include(sdk, '– auth: apikey-iot');
});
```

**Add three new tests at the end of the `describe('generateSDK output', ...)` block:**
```ts
it('output contains buildModules function', () => {
    assert.include(sdk, 'export function buildModules(');
});

it('output does not contain APIClient class', () => {
    assert.notInclude(sdk, 'class APIClient');
});

it('output does not contain AJV instantiation', () => {
    assert.notInclude(sdk, 'new Ajv()');
});
```

- [ ] **Step 2: Update category 3 test**

Find the `describe('TypeScript transpilation', ...)` block and replace the final assertion:

```ts
// OLD:
assert.ok(result.outputText.length > 0);

// NEW (also check that buildModules is in the output):
assert.include(result.outputText, 'buildModules');
```

Also update the describe label to reflect what it's testing:
```ts
// OLD:
describe('TypeScript transpilation', () => {
    it('generated SDK transpiles without diagnostics', () => {

// NEW:
describe('TypeScript transpilation', () => {
    it('generated routes.ts transpiles without diagnostics', () => {
```

- [ ] **Step 3: Remove category 4 entirely**

Delete the entire `describe('Runtime instantiation', ...)` block (lines approximately 301–553 in the current file). This is the block starting with:
```ts
describe('Runtime instantiation', () => {
```
and ending with its closing `});`.

- [ ] **Step 4: Compile back and run the tests — expect failures on the updated/new category 2 assertions**

The back test suite runs against compiled JS in `dist/`. Compile first:

```bash
cd back && npx tsc && npm run tests:scripts
```

Expected: category 1 tests pass, several category 2 tests fail (the generator still produces the old format), category 3 may or may not pass.

- [ ] **Step 5: Commit the updated tests (failing state is intentional)**

```bash
git add back/tests/scripts/generateSDK.test.ts
git commit -m "test: update generateSDK tests for new routes.ts output format"
```

---

## Task 4: Update the Nunjucks templates and generator output path

**Files:**
- Modify: `back/scripts/templates/route.njk`
- Modify: `back/scripts/templates/sdk.njk`
- Modify: `back/scripts/generateSDK.ts`
- Modify: `back/package.json`

The generator TypeScript code stays almost unchanged. The templates change to produce `routes.ts` content instead of the full SDK file. The output filename changes from `index.ts` to `routes.ts`.

- [ ] **Step 1: Replace `back/scripts/templates/route.njk`**

This template generates one method inside `buildModules`. The key changes from the current version: no `this.fetch<Bundle>()` call — instead a plain `fetch()` call with an explicit `as Promise<OutputType>` cast.

```njk
        /** {{ method }} {{ routePath }} – auth: {{ authentication }} */
        {{ name }}: async ({{ params }}): Promise<{{ outputType }}> =>
            fetch('{{ routePath }}'{{ pathParamsTransform }}, {{ bodyArg }}, { {% if hasInput %}inputSchema: schemas.{{ inputSchemaName }}, {% endif %}outputSchema: schemas.{{ outputSchemaName }}, endpoint: '{{ module }}.{{ name }}' }, { method: '{{ method }}' }, { type: '{{ authentication }}' }) as Promise<{{ outputType }}>,
```

- [ ] **Step 2: Replace `back/scripts/templates/sdk.njk`**

This template generates the full `routes.ts` file. Remove all the `APIClient` class, AJV setup, and validation helpers — those live in `packages/sdk/src/client.ts`. Replace with a template that emits only schemas, helper types, type exports, and `buildModules`.

```njk
// AUTO-GENERATED - do not edit. Run: cd back && npm run generate:sdk
// Generated on: {{ generatedOn }}

import type { FromSchema } from 'json-schema-to-ts';
import type { Endpoint, FetchFn } from '../types.js';

export const schemas = {{ schemasJson }} as const;

// Type exports
{{ typeExports }}

export function buildModules(fetch: FetchFn) {
    return {
{% for mod in modules %}
  {{ mod.name }}: {
{{ mod.methods }}
  }{% if not loop.last %},{% endif %}

{% endfor %}
    };
}
```

- [ ] **Step 3: Update `main()` in `back/scripts/generateSDK.ts` to output `routes.ts`**

Change only the output filename:
```ts
// OLD:
const outputFile = path.join(outputDir, 'index.ts');

// NEW:
const outputFile = path.join(outputDir, 'routes.ts');
```

- [ ] **Step 4: Update the `generate:sdk` script in `back/package.json`**

```json
// OLD:
"generate:sdk": "npx tsx scripts/generateSDK.ts ../front/src/vendor/statox-api",

// NEW:
"generate:sdk": "npx tsx scripts/generateSDK.ts ../packages/sdk/src/generated",
```

- [ ] **Step 5: Run the generator to create the real `routes.ts`**

```bash
cd back && npm run generate:sdk
```

Expected output:
```
1. Generating SDK...
2. Found N routes
3. Grouped into M modules
4. SDK generated successfully!
5. Output: ../packages/sdk/src/generated/routes.ts
```

Verify the content:
```bash
head -30 packages/sdk/src/generated/routes.ts
```

Expected: header comment, `import type { FromSchema }`, `export const schemas = {`, no `class APIClient`.

- [ ] **Step 6: Compile back and run generator tests — expect all passing**

The `before()` hook in the test file copies the source templates to `dist/scripts/templates/`. This ensures the updated `.njk` files are used during test runs. Compile before running:

```bash
cd back && npx tsc && npm run tests:scripts
```

Expected: all tests pass, including the updated category 2 and 3 assertions.

- [ ] **Step 7: Run SDK tests with the real generated routes**

```bash
cd packages/sdk && npm run tests
```

Expected: all 13 tests still pass (the placeholder `routes.ts` has been replaced but tests only use `BaseAPIClient` directly).

- [ ] **Step 8: Run lint on both back and SDK**

```bash
cd back && npm run check
cd packages/sdk && npm run check
```

Fix any issues.

- [ ] **Step 9: Commit**

```bash
git add back/scripts/templates/sdk.njk back/scripts/templates/route.njk
git add back/scripts/generateSDK.ts back/package.json back/tests/scripts/generateSDK.test.ts
git add packages/sdk/src/generated/routes.ts
git commit -m "feat: update templates and generator to produce routes.ts with buildModules"
```

---

## Task 5: Wire the frontend to use the new package

**Files:**
- Modify: `front/package.json`
- Modify: `front/src/lib/api/client2.ts`
- Modify: `front/src/lib/api/errors.ts`
- Modify: `front/src/lib/HomeTracker/service.ts`
- Modify: `front/src/routes/(apps)/songbook/edit/+page.svelte`
- Modify: `front/svelte.config.js`
- Delete: `front/src/vendor/statox-api/index.ts`

- [ ] **Step 1: Add the SDK as a devDependency in `front/package.json`**

Add to the `devDependencies` object (alphabetical order, near the other local packages):
```json
"statox-api": "file:../packages/sdk",
```

- [ ] **Step 2: Run `npm install` in `front/`**

```bash
cd front && npm install
```

Expected: `front/node_modules/statox-api` is a symlink to `../../packages/sdk`. No errors.

- [ ] **Step 3: Update `front/src/lib/api/client2.ts`**

```ts
import { getApiUrl } from '$lib/helpers';
import { APIClient } from 'statox-api';

export const client2 = APIClient({
    baseURL: getApiUrl()
});
```

(Removed `new`, changed import path from `$vendor/statox-api` to `statox-api`.)

- [ ] **Step 4: Update `front/src/lib/api/errors.ts`**

```ts
export { ApiError } from 'statox-api';
```

- [ ] **Step 5: Update `front/src/lib/HomeTracker/service.ts`**

Change only the import path on line 4:
```ts
// OLD:
import type { Ephemerides_GetRange_Output } from '$vendor/statox-api';

// NEW:
import type { Ephemerides_GetRange_Output } from 'statox-api';
```

- [ ] **Step 6: Update `front/src/routes/(apps)/songbook/edit/+page.svelte`**

Change only the import path on line 12:
```ts
// OLD:
import type { Chords_UpdateAll_Errors } from '$vendor/statox-api';

// NEW:
import type { Chords_UpdateAll_Errors } from 'statox-api';
```

- [ ] **Step 7: Update stale comment in `front/src/lib/auth/types.ts`**

Line 2 has a comment referencing the old vendor path. Update it:
```ts
// OLD:
// TODO Extract that directly from src/vendor/statox-api/index.ts

// NEW:
// TODO Extract that directly from statox-api
```

- [ ] **Step 8: Remove the `$vendor` alias from `front/svelte.config.js`**

Find and remove these lines from the `alias` object:
```js
$vendor: 'src/vendor'
```

If it was the only alias in the object, the alias block can be removed entirely. If not, just remove this entry.

- [ ] **Step 9: Delete the old vendor directory**

```bash
rm front/src/vendor/statox-api/index.ts
rmdir front/src/vendor/statox-api
rmdir front/src/vendor
```

- [ ] **Step 10: Run `npm run check` in `front/` to verify TypeScript + Svelte types**

```bash
cd front && npm run check
```

Expected: no TypeScript errors.

- [ ] **Step 11: Run `npm run build` in `front/` to verify the production build succeeds**

```bash
cd front && npm run build
```

Expected: build completes without errors. Artifacts written to `docs/`.

- [ ] **Step 12: Commit**

```bash
git add front/package.json front/package-lock.json front/svelte.config.js
git add front/src/lib/api/client2.ts front/src/lib/api/errors.ts front/src/lib/auth/types.ts
git add front/src/lib/HomeTracker/service.ts
git add "front/src/routes/(apps)/songbook/edit/+page.svelte"
git rm front/src/vendor/statox-api/index.ts
git commit -m "feat: wire frontend to consume statox-api from packages/sdk"
```

---

## Task 6: Write `packages/sdk/README.md`

**Files:**
- Create: `packages/sdk/README.md`

- [ ] **Step 1: Write `packages/sdk/README.md`**

```markdown
# statox-api

TypeScript SDK for `api.statox.fr`. Provides the `APIClient` class and full type safety for all API endpoints.

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
```

- [ ] **Step 2: Commit**

```bash
git add packages/sdk/README.md
git commit -m "docs: add packages/sdk README documenting source-only approach"
```

---

## Task 7: Final validation

- [ ] **Step 1: Run all back tests**

```bash
cd back && npm run tests:all
```

Expected: all test suites pass.

- [ ] **Step 2: Run SDK tests**

```bash
cd packages/sdk && npm run tests
```

Expected: all 13 tests pass.

- [ ] **Step 3: Run front build**

```bash
cd front && npm run build
```

Expected: successful static build to `docs/`.

- [ ] **Step 4: Run front type check**

```bash
cd front && npm run check
```

Expected: no TypeScript or Svelte errors.

- [ ] **Step 5: Run lint + prettier on all three packages**

```bash
cd back && npm run check
cd packages/sdk && npm run check
cd front && npm run lint && npm run prettier
```

Fix any remaining issues.

- [ ] **Step 6: Final commit if any fixups were needed**

```bash
git add -p
git commit -m "chore: fixups from final validation"
```
