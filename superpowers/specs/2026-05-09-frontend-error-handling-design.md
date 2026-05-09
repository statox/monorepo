# Frontend Error Handling Rework - Design Spec

**Date:** 2026-05-09  
**Branch:** feat/error-handling-rework  
**Status:** Approved

## Problem

The backend has a well-typed error contract: each route declares `clientErrors: ErrorCode[]`,
the error middleware serializes AppErrors to `{ httpStatus, code, reason? }`, and `ErrorCode`
is a string union of named codes like `'ITEM_NOT_FOUND'`, `'UNAUTHORIZED'`, etc.

The SDK generator ignores `clientErrors` entirely. The generated `fetch` method throws
`new Error("HTTP 401: Unauthorized")` without reading the JSON response body. This causes:

- `instanceof ApiError` checks on the frontend are always false (the SDK never throws `ApiError`)
- 401 detection is done by string-matching `error.message`
- No TypeScript guidance on which error codes are possible per endpoint
- Critical missing try/catch in several page load functions causing app crashes

## Scope

Three layers, only two require changes:

1. **Backend** — no changes. `clientErrors` and `ALWAYS_CLIENT_ERRORS` are already correct.
2. **SDK generator** — pass `clientErrors` through; emit per-endpoint error unions; fix `fetch`.
3. **Frontend** — update import source; fix error code comparisons; fill critical gaps.

---

## Layer 1: Backend (no changes)

Routes already declare their error contract:

```typescript
export const route: PostRoute<Input, EmptyOutput> = {
    clientErrors: ['FILE_OR_CONTENT_REQUIRED', 'ITEM_ALREADY_EXISTS'],
    authentication: 'user2',
    // ...
};
```

Error middleware serializes to:
```json
{ "httpStatus": 404, "code": "ITEM_NOT_FOUND", "reason": "optional detail" }
```

`ALWAYS_CLIENT_ERRORS` in `codes.ts` defines which codes are forwarded on every request
regardless of route declarations:
- `user2` auth: `UNAUTHORIZED`, `FORBIDDEN_FOR_USER`, `INVALID_SCOPE`
- `apikey` / `apikey-iot` auth: `MISSING_API_KEY`, `INVALID_AUTH_HEADER`, `UNKNOWN_API_KEY`

---

## Layer 2: SDK Generator

### 2a. `back/scripts/generateSDK.ts`

**`GroupedRoute` interface** gains one field:

```typescript
interface GroupedRoute {
    // ... existing fields
    clientErrors: string[];   // added — defaults to [] if route has none
}
```

**`groupRoutes()`** populates it:

```typescript
const groupedRoute: GroupedRoute = {
    // ... existing fields
    clientErrors: route.clientErrors ?? []
};
```

**`generateSDK()`** builds per-endpoint error union strings. A helper maps authentication
type to the corresponding always-errors:

```typescript
const AUTH_ERRORS: Record<string, string[]> = {
    user2:       ['UNAUTHORIZED', 'FORBIDDEN_FOR_USER', 'INVALID_SCOPE'],
    apikey:      ['MISSING_API_KEY', 'INVALID_AUTH_HEADER', 'UNKNOWN_API_KEY'],
    'apikey-iot':['MISSING_API_KEY', 'INVALID_AUTH_HEADER', 'UNKNOWN_API_KEY'],
    none:        []
};
```

Every endpoint also gets `'INTERNAL_SERVER_ERROR'` (unexpected server failure) and
`'NETWORK_ERROR'` (no response at all — DNS failure, timeout, etc.) since both can
happen on any call.

The `typeExports` generation loop emits an `_Errors` type alongside the existing `_Output`
and bundle types:

```typescript
const errorCodes = [
    ...route.clientErrors,
    ...AUTH_ERRORS[route.authentication],
    'INTERNAL_SERVER_ERROR',
    'NETWORK_ERROR'
];
const errorUnion = errorCodes.map(c => `'${c}'`).join(' | ');
const errorType = generateErrorType(module, route.name);   // e.g. Clipboard_AddEntry_Errors
types.push(`export type ${errorType} = ${errorUnion};`);
```

A new helper function:

```typescript
function generateErrorType(module: string, name: string): string {
    return `${capitalizeFirst(module)}_${capitalizeFirst(name)}_Errors`;
}
```

### 2b. `back/scripts/templates/sdk.njk`

**`ApiError` class** is added to the template (before the `APIClient` class):

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

**`APIClientConfig.onError`** signature tightens to use `ApiError`:

```typescript
export interface APIClientConfig {
    baseURL: string;
    apiKey?: string;
    onError?: (error: ApiError, endpoint: string) => void;
}
```

**`fetch` method** error branch replaces the current `new Error(...)` throw:

```typescript
// Before
if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
    this.onError?.(error, path);
    throw error;
}

// After
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

The outer `catch` block that wraps the whole fetch also updates to rethrow as `ApiError`
for network-level failures (no response at all):

```typescript
} catch (error) {
    if (error instanceof ApiError) throw error;
    const err = new ApiError(0, 'NETWORK_ERROR', String(error));
    this.onError?.(err, path);
    throw err;
}
```

This requires adding `'NETWORK_ERROR'` to `ERROR_CODES` in the backend, or treating it
as a frontend-only sentinel. Since it cannot originate from the backend, it should live
only in the SDK template as a special string — it does not need to be added to `ERROR_CODES`.

---

## Layer 3: Frontend

### 3a. Replace `lib/api/errors.ts`

`front/src/lib/api/errors.ts` currently defines a dead `ApiError` with `code: number`.
It is deleted. The file is replaced with a re-export so existing `$lib/api` imports
continue to resolve without touching every import site:

```typescript
// front/src/lib/api/errors.ts  (new content)
export { ApiError } from '$vendor/statox-api';
```

This is the only change needed to make `instanceof ApiError` work at all existing call sites.

### 3b. Fix error code comparisons (3 sites)

All three places that check `error.code === 401` update to use the string code:

| File | Before | After |
|---|---|---|
| `lib/components/FormLayout/formErrorHandler.ts:8` | `error.code === 401` | `error.code === 'UNAUTHORIZED'` |
| `lib/Songbook/service.ts:72` | `error.code === 401` | `error.code === 'UNAUTHORIZED'` |
| `lib/PersonalTracker/service.ts:112` | `error.code === 401` | `error.code === 'UNAUTHORIZED'` |

### 3c. Fix critical gaps

Four locations with missing error handling that cause crashes or silent failures:

**`routes/(apps)/songbook/+page.ts`** — page load with no try/catch:
```typescript
// Wrap the API call in try/catch; on failure return an empty/fallback state
// rather than letting SvelteKit render its default crash page.
```

**`routes/(apps)/songbook/edit/+page.ts`** — same issue, same fix.

**`routes/(apps)/gravitrips/2players/+page.svelte`** — `getNewGameId()` at line 36 has
no error handling; a failed call crashes the component. Wrap in try/catch and show an
error state.

**`lib/auth/api.ts:updateProfile()`** — error is silently swallowed with no user feedback.
Add a toast notification on failure.

---

## Usage after this change

### Checking for a specific business error

```typescript
import { ApiError } from '$vendor/statox-api';
import type { Clipboard_AddEntry_Errors } from '$vendor/statox-api';

try {
    await addClipboardEntry(input);
} catch (error) {
    if (error instanceof ApiError) {
        const e = error as ApiError<Clipboard_AddEntry_Errors>;
        switch (e.code) {
            case 'FILE_OR_CONTENT_REQUIRED': showToast('Please add a file or text'); break;
            case 'ITEM_ALREADY_EXISTS':      showToast('Entry already exists'); break;
            case 'UNAUTHORIZED':             redirectToLogin(); break;
            default:                         showToast('Something went wrong'); break;
        }
    }
}
```

### Generic fallback (data loads, most existing `{#await}{:catch}` blocks)

No code change needed in most `{#await}{:catch}` blocks — they already show a generic
error message. The improvement is that `error` is now an `ApiError` with a `.httpStatus`
and `.code` field if finer-grained display is ever needed.

---

## Files changed

| File | Change |
|---|---|
| `back/scripts/generateSDK.ts` | Add `clientErrors` to `GroupedRoute`; populate in `groupRoutes()`; emit `_Errors` types in `generateSDK()` |
| `back/scripts/templates/sdk.njk` | Add `ApiError` class; fix `fetch` error branch; fix outer catch |
| `front/src/vendor/statox-api/index.ts` | Re-generated — no manual edits |
| `front/src/lib/api/errors.ts` | Replace with re-export from vendor |
| `front/src/lib/components/FormLayout/formErrorHandler.ts` | `401` → `'UNAUTHORIZED'` |
| `front/src/lib/Songbook/service.ts` | `401` → `'UNAUTHORIZED'` |
| `front/src/lib/PersonalTracker/service.ts` | `401` → `'UNAUTHORIZED'` |
| `routes/(apps)/songbook/+page.ts` | Add try/catch to load function |
| `routes/(apps)/songbook/edit/+page.ts` | Add try/catch to load function |
| `routes/(apps)/gravitrips/2players/+page.svelte` | Add try/catch around `getNewGameId()` |
| `front/src/lib/auth/api.ts` | Add error feedback in `updateProfile()` |

---

## What this does NOT change

- Backend route definitions — no edits required
- The three existing frontend error-handling patterns (`{#await}{:catch}`, `try/catch + toast`,
  `handleFormError`) — kept as-is, internal error discrimination is fixed
- API wrapper files (`Clipboard/api.ts`, `Cookbook/api.ts`, etc.) — their pass-through
  pattern is unchanged; call sites that use `{#await}{:catch}` already handle errors
- Silent failures in service layer internals (`PersonalTracker` decrypt filtering,
  `HomeTracker` moon phase parsing) — out of scope; those are intentional design choices
