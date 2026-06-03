# SDK `withOptions` - keepalive support

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `withOptions({ keepalive?: true })` to `APIClient` so callers can pass call-time fetch options without polluting individual method signatures, and update the `webStats.record` call site to use it.

**Architecture:** `APIClient` factory gains a `makeModules` internal helper that wraps `base._fetch` with merged options. `withOptions` calls `makeModules` with the extra options and returns the modules-only proxy. The existing `buildModules` call is refactored to use `makeModules()` with no args. No generated code changes, no backend changes.

**Tech Stack:** TypeScript, Mocha + Chai + sinon (SDK tests), SvelteKit/Svelte 5 (frontend call site).

---

## Context for the implementer

- `packages/sdk/src/client.ts` - The file to modify. The `_fetch` method already accepts `keepalive?: true` in its `options` parameter (uncommitted change on disk) and passes it to native `fetch`. The `APIClient` factory at the bottom of the file uses `buildModules(fetchFn)` from the generated file to attach module namespaces to the base client.
- `packages/sdk/src/generated/routes.ts` - Auto-generated. **Do not edit.** `buildModules` is exported from here. Generated route methods call the `FetchFn` with `{ method: 'GET' | 'POST' }` - they never set keepalive.
- `packages/sdk/src/types.ts` - Defines `FetchFn`. No changes needed: the `withOptions` wrapper spreads `extraOptions` _after_ receiving options from generated routes, then calls `base._fetch` which already types `keepalive` correctly.
- `packages/sdk/tests/client.test.ts` - Existing test suite for `BaseAPIClient` and the `APIClient` factory.
- `front/src/routes/(apps)/+layout.svelte` - The only frontend call site. Has a TODO comment to switch to keepalive. Currently calls `client2.webStats.record(webStatEvent)` inside `beforeNavigate`.

### Current APIClient factory (packages/sdk/src/client.ts:150-158)

```typescript
export function APIClient(config: APIClientConfig) {
    const base = new BaseAPIClient(config);
    return Object.assign(
        base,
        buildModules((path, body, file, validation, options, auth) =>
            base._fetch(path, body, file, validation, options, auth)
        )
    );
}
```

### Target shape after implementation

```typescript
export function APIClient(config: APIClientConfig) {
    const base = new BaseAPIClient(config);

    const makeModules = (extraOptions: { keepalive?: true } = {}) =>
        buildModules((path, body, file, validation, options, auth) =>
            base._fetch(path, body, file, validation, { ...options, ...extraOptions }, auth)
        );

    return Object.assign(base, makeModules(), {
        withOptions: (opts: { keepalive?: true }) => makeModules(opts)
    });
}
```

### webStats.record input (needed in tests)

`webStats.record` requires: `{ clientTimestamp: number, app: string, path: string, action: string, clientId: string }` and returns `{}`.

---

## Task 1: Test keepalive plumbing in BaseAPIClient._fetch

The implementation already exists (uncommitted). Write the tests to pin the behaviour.

**Files:**
- Modify: `packages/sdk/tests/client.test.ts`

- [ ] **Step 1: Add two tests inside the existing `BaseAPIClient` describe block** — after the `'sends mode: cors on all requests'` test (line 528):

```typescript
it('passes keepalive: true to native fetch when keepalive option is set', async () => {
    const { client, fetchStub } = makeClient();
    fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve({ result: 'test' })
    } as Response);

    await client._fetch(
        '/test/get',
        null,
        null,
        validation,
        { method: 'GET', keepalive: true },
        { type: 'none' }
    );

    const [, opts] = fetchStub.firstCall.args;
    assert.isTrue((opts as RequestInit).keepalive);
});

it('does not set keepalive when not specified in options', async () => {
    const { client, fetchStub } = makeClient();
    fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve({ result: 'test' })
    } as Response);

    await client._fetch(
        '/test/get',
        null,
        null,
        validation,
        { method: 'GET' },
        { type: 'none' }
    );

    const [, opts] = fetchStub.firstCall.args;
    assert.isUndefined((opts as RequestInit).keepalive);
});
```

- [ ] **Step 2: Run the tests — expect PASS** (implementation already exists on disk)

```bash
cd packages/sdk && npm run tests
```

Expected: all tests pass, including the two new ones.

- [ ] **Step 3: Commit**

```bash
git add packages/sdk/tests/client.test.ts packages/sdk/src/client.ts
git commit -m "$(cat <<'EOF'
test: pin BaseAPIClient._fetch keepalive behaviour

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Write failing tests for withOptions

**Files:**
- Modify: `packages/sdk/tests/client.test.ts`

- [ ] **Step 1: Add a new describe block at the end of the file**, after the closing `});` of `'APIClient factory'`:

```typescript
describe('APIClient.withOptions', () => {
    function makeAPIClient() {
        const fetchStub = sinon.stub<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
        const client = APIClient({
            baseURL: 'http://localhost:3000',
            fetcher: fetchStub as unknown as typeof fetch
        });
        return { client, fetchStub };
    }

    const webStatsPayload = {
        clientTimestamp: 1000000,
        app: 'test-app',
        path: '/test',
        action: 'navigated',
        clientId: 'test-client'
    };

    it('withOptions is a function on the returned client', () => {
        const { client } = makeAPIClient();
        assert.isFunction(client.withOptions);
    });

    it('withOptions({ keepalive: true }) passes keepalive: true to native fetch', async () => {
        const { client, fetchStub } = makeAPIClient();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({})
        } as Response);

        await client.withOptions({ keepalive: true }).webStats.record(webStatsPayload);

        const [, opts] = fetchStub.firstCall.args;
        assert.isTrue((opts as RequestInit).keepalive);
    });

    it('direct client calls do not set keepalive', async () => {
        const { client, fetchStub } = makeAPIClient();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({})
        } as Response);

        await client.webStats.record(webStatsPayload);

        const [, opts] = fetchStub.firstCall.args;
        assert.isUndefined((opts as RequestInit).keepalive);
    });

    it('withOptions({}) does not set keepalive', async () => {
        const { client, fetchStub } = makeAPIClient();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({})
        } as Response);

        await client.withOptions({}).webStats.record(webStatsPayload);

        const [, opts] = fetchStub.firstCall.args;
        assert.isUndefined((opts as RequestInit).keepalive);
    });
});
```

- [ ] **Step 2: Run the tests — expect 3 FAILURES** (withOptions doesn't exist yet)

```bash
cd packages/sdk && npm run tests
```

Expected: `TypeError: client.withOptions is not a function` on the three tests that call `withOptions`. The first test (`withOptions is a function`) should also fail with `AssertionError: expected undefined to be a function`.

---

## Task 3: Implement withOptions in APIClient

**Files:**
- Modify: `packages/sdk/src/client.ts:150-161`

- [ ] **Step 1: Replace the APIClient factory function** with the version below. The only change is adding `makeModules` and `withOptions` — all other client behaviour is unchanged:

```typescript
export function APIClient(config: APIClientConfig) {
    const base = new BaseAPIClient(config);

    // makeModules wraps buildModules so every generated route call merges extraOptions
    // into the native fetch options. Called with no args for the default client modules;
    // called by withOptions to produce a one-shot proxy with caller-supplied overrides
    // (e.g. keepalive: true for telemetry that must survive page navigation).
    const makeModules = (extraOptions: { keepalive?: true } = {}) =>
        buildModules((path, body, file, validation, options, auth) =>
            base._fetch(path, body, file, validation, { ...options, ...extraOptions }, auth)
        );

    return Object.assign(base, makeModules(), {
        withOptions: (opts: { keepalive?: true }) => makeModules(opts)
    });
}

export type APIClient = ReturnType<typeof APIClient>;
```

- [ ] **Step 2: Run the tests — expect all to PASS**

```bash
cd packages/sdk && npm run tests
```

Expected: all tests pass including the 4 new `withOptions` tests.

- [ ] **Step 3: Run lint and type check**

```bash
cd packages/sdk && npm run check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/sdk/src/client.ts packages/sdk/tests/client.test.ts
git commit -m "$(cat <<'EOF'
feat: add withOptions to APIClient for call-time fetch options

Adds client.withOptions({ keepalive: true }) which returns a modules-only
proxy where every call merges the extra options into the native fetch call.
Original client calls are unaffected.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Update the frontend call site

**Files:**
- Modify: `front/src/routes/(apps)/+layout.svelte`

- [ ] **Step 1: Replace the webStats call** in the `beforeNavigate` callback. Find the block that starts around line 21:

Old:
```typescript
beforeNavigate(({ from }) => {
    const webStatEvent = {
        clientTimestamp: Date.now(),
        app: 'apps.statox.fr',
        path: from?.url.pathname || 'N/A',
        action: 'navigated',
        clientId: 'foobar'
    };

    // TODO: Replace this with a `fetch` with `keepalive: true`
    //sendBeacon only sends `test/plain` and changing the API to
    // accept that is annoying
    // The final solution will simply call `client.webState.record()`
    // but before that we need to update the SDK
    // navigator.sendBeacon('http://localhost:3000/web-stats/record', webStatEvent);
    client2.webStats.record(webStatEvent);
});
```

New:
```typescript
beforeNavigate(({ from }) => {
    const webStatEvent = {
        clientTimestamp: Date.now(),
        app: 'apps.statox.fr',
        path: from?.url.pathname || 'N/A',
        action: 'navigated',
        clientId: 'foobar'
    };

    client2.withOptions({ keepalive: true }).webStats.record(webStatEvent);
});
```

- [ ] **Step 2: Run the frontend type checker**

```bash
cd front && npm run check
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add front/src/routes/(apps)/+layout.svelte
git commit -m "$(cat <<'EOF'
feat: send webStats telemetry with keepalive: true

Uses the new withOptions API so the fetch survives page navigation.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Document withOptions in the SDK README

**Files:**
- Modify: `packages/sdk/README.md`

- [ ] **Step 1: Add a `withOptions` section** between "Consuming the package" and "Generated file". Insert this block after the closing ` ``` ` of the import example (after line 42):

```markdown
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
```

- [ ] **Step 2: Verify the file renders correctly** by eyeballing the raw markdown — confirm the code fence closes properly and there are no broken headings.

- [ ] **Step 3: Commit**

```bash
git add packages/sdk/README.md
git commit -m "$(cat <<'EOF'
docs: document APIClient.withOptions and keepalive use case

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```
