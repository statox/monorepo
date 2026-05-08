# API Error Handling Audit

**Date:** 2026-05-04  
**Scope:** Backend service layer, Express middleware pipeline, frontend SDK and components

---

## 1. Backend - Error Creation in Service Layer

### Custom Error Classes

There are **18 custom error classes** spread across the codebase. They fall into three groups:

**Modules with a dedicated `errors.ts` file:**

| File | Error Classes |
|------|--------------|
| `back/src/libs/modules/auth/errors.ts` | `Auth_UnauthorizedError`, `Auth_ForbiddenForUserError`, `Auth_InvalidScopeError` |
| `back/src/libs/modules/cookbook/errors.ts` | `DuplicateIngredientError` (captures ingredient name), `RecipeNotFoundError` (captures recipe id) - extend a local `CustomError` base class |
| `back/src/libs/modules/ephemerides/services/errors.ts` | `RangeTooLargeError`, `RangeInvalid` |
| `back/src/libs/modules/webReader/errors.ts` | `InvalidUrlError` |
| `back/src/libs/routes/errors.ts` | `FileOrContentRequiredError`, `ItemAlreadyExistsError`, `ItemNotFoundError`, `ExpiredItemError`, `TooManyEntriesError` |

**Modules with errors defined inline (no dedicated file):**

| Location | Error Class |
|----------|-------------|
| `back/src/libs/modules/homeTracker/services/sensorMetaData.ts:73` | `SensorDoesNotExistError` |
| `back/src/libs/modules/webWatcher/watchers.ts:51` | `EntryAlreadyExistsError` |
| `back/src/libs/modules/gravitrips/board.ts:20` | `InvalidMoveError` |
| `back/src/libs/middleware/authAPIKey.middleware.ts:54` | `ApiKeyError` base + `MissingApiKeyError`, `InvalidAuthHeaderError`, `UnknownApiKeyError` |
| `back/src/libs/middleware/apiPipeline.middleware.ts:10` | `OutputValidationError` |

`ApiKeyError` is the only error class with HTTP metadata properties (`status`, `statusCode`, `code`). All other custom errors are plain `Error` subclasses with no status code, no error code identifier, and no structured data beyond what's in the message string.

The only exceptions are `DuplicateIngredientError` and `RecipeNotFoundError` in cookbook, which capture one contextual field each (ingredient name / recipe id) - but this data is never surfaced in the API response.

### Generic Error Instances

Many modules throw raw `new Error('string')` instead of custom classes:

| Module | Examples |
|--------|---------|
| `modules/auth/services.ts:17,20` | `'Username must be defined'`, `'Password must be defined'` |
| `modules/homeTracker/services/weatherForecast.ts:137,140,147,150,208` | `'MISSING_HISTORIC_DATA'`, `'MISSING_RECENT_DATA'`, `'INVALID_DATA'`, etc. |
| `modules/chords/queries.ts:37` | `'Empty chords file'` |
| `modules/meteofrance/services.ts:17` | `'Meteo france API did not respond'` |
| `modules/gravitrips/Game.ts:113,123,128` | Game state error strings |

These generic errors are **not caught by the central error middleware** (no `instanceof` match) and fall through to the 500 default.

### Error Message Format Inconsistency

Three distinct formats exist with no enforced convention:

- `UPPERCASE_SNAKE_CASE` constants: `'UNAUTHORIZED'`, `'RANGE_TOO_LARGE'`, `'MISSING_HISTORIC_DATA'`
- Human-readable sentences: `'Username must be defined'`, `'Slack notification without message or error to notify'`
- Interpolated strings: `'Trying to add player 1 to a game in state ' + this.gameState`

### Repeated Code: DB Duplicate Key Handling

The same try/catch pattern appears in three independent places:

```typescript
// Identical block in:
// back/src/libs/modules/cookbook/services/addRecipe.ts:88-92
// back/src/libs/modules/reactor/addEntry.ts:36-41
// back/src/libs/modules/clipboard/addEntry.ts:50-55
catch (error) {
    if ((error as QueryError).code === 'ER_DUP_ENTRY') {
        throw new ItemAlreadyExistsError();
    }
    throw error;
}
```

A fourth variant in `webWatcher/watchers.ts:83-88` throws `EntryAlreadyExistsError` (a different class) for the same SQL condition.

---

## 2. Backend - Endpoint Handler → Middleware Error Pipeline

### Flow

```
Route handler (throws custom error)
  ↓
apiPipeline.middleware.ts (try/catch → next(error))
  ↓
errors.middleware.ts (instanceof chain → HTTP response + Slack notification)
```

**`apiPipeline.middleware.ts`** (`back/src/libs/middleware/apiPipeline.middleware.ts:16-68`):
- Wraps every route handler in a try/catch
- On AJV output schema failure: wraps in `OutputValidationError`, calls `next(new OutputValidationError())`
- On all other errors: calls `next(error)` directly
- Route handlers never use try/catch themselves - they just `throw`

**`app.ts`** (`back/src/app.ts:52-122`):
- Registers `errorHandler` as the **last** middleware (line 116)
- Each route gets a dynamically assembled middleware pipeline: auth middleware → input validator → apiPipeline → route handler

### How Errors Reach the Handler

Route handlers simply throw; `apiPipeline` catches everything. No route handler has its own try/catch block.

---

## 3. Backend - Error Filtering (Current State)

**All filtering is centralized in `errors.middleware.ts`** (`back/src/libs/middleware/errors.middleware.ts:23-88`).

The handler uses a chain of `instanceof` checks to assign HTTP status codes:

| Condition | Status | Error Types |
|-----------|--------|-------------|
| `OutputValidationError` | 500 | Output schema mismatch (non-prod only validated) |
| Business logic errors | 400 | `ItemAlreadyExistsError`, `FileOrContentRequiredError`, `EntryAlreadyExistsError`, `ItemNotFoundError`, `DuplicateIngredientError`, `RecipeNotFoundError`, `SensorDoesNotExistError`, `RangeTooLargeError`, `RangeInvalid`, `InvalidUrlError` |
| Auth errors | 401 | `Auth_UnauthorizedError`, `Auth_ForbiddenForUserError`, `Auth_InvalidScopeError` |
| API key errors | 401/403 | `ApiKeyError` subclasses (status taken from `error.status`) |
| Input validation | 400 | `ValidationError` from `express-json-validator-middleware` |
| Default (unhandled) | 500 | Anything else |

**Per-endpoint error filtering:** does not exist. The only path-specific logic is at line 68-70: `/auth/me` suppresses Slack notifications to avoid spam from expected 401s during session expiry. All other error categorization is purely type-based.

**Coupling problem:** The error middleware imports error classes from 8 different modules. Every new business error class requires updating `errors.middleware.ts`.

**WebSocket errors:** `app-ws.ts` sends `{ error: 'invalid_path' }` directly on the WebSocket and never calls the central error handler. WS route handlers manage their own errors inline.

---

## 4. Backend - Error Response Format

All error responses share one shape:

```json
{ "message": "..." }
```

Exceptions:
- **Input validation errors** (line 76): `message` is `JSON.stringify(error.validationErrors)` - a JSON string nested inside a JSON string, not a structured object
- **Output validation error**: hardcoded `'Failed output validation'`
- **Unhandled errors**: hardcoded `'Internal Server Error'`

There are no error codes, no request IDs, no structured error type identifiers in any response. The `message` field is the sole channel for distinguishing errors on the client side.

**Status codes used:** 400, 401, 403, 500 only.

---

## 5. Frontend - SDK and API Client

### Structure

```
vendor/statox-api/index.ts   ← Auto-generated SDK (OpenAPI → TypeScript)
src/lib/api/client2.ts       ← Single shared APIClient instance
src/lib/{Feature}/api.ts     ← Per-feature wrappers calling SDK methods
```

**`client2.ts`** (`front/src/lib/api/client2.ts`):
```typescript
new APIClient({ baseURL: getApiUrl(), credentials: 'include' })
```
No `onError` callback is configured. All error handling is delegated to calling code.

**SDK fetch method** (`vendor/statox-api/index.ts:2065-2087`):
- On non-OK response: creates `new Error(\`HTTP ${response.status}: ${response.statusText}\`)` and throws
- Does **not** use `ApiError`; raw HTTP status info is embedded in the error message string
- Calls `onError?.(error, path)` before throwing (callback not configured)

**Alternative HTTP client:** `superagent` is used for file uploads in `Clipboard/api.ts` and `Reactor/api.ts`, bypassing the SDK entirely.

### Typed Error Classes on the Frontend

**`front/src/lib/api/errors.ts`:**
```typescript
export class ApiError extends Error {
    code: number;
    constructor(code: number, message: string) { ... }
}
```
This class exists but is **not used by the SDK's fetch method** - which throws a generic `Error`. `ApiError` is only constructed in feature-level wrappers if they explicitly check response status.

**`front/src/lib/auth/errors.ts`:**
```typescript
export class UserLoggedOutError extends Error {
    constructor() { super('USER_LOGGED_OUT'); }
}
```
A comment in the file notes this is **legacy** - no longer sent by the API after the auth0 → passport migration. Still imported and checked in `formErrorHandler.ts` - dead code.

---

## 6. Frontend - Error Handling Patterns

Four distinct patterns exist in the codebase with no consistent convention:

### Pattern A: Svelte `{:catch error}` promise blocks

Most common. Used across all page-level data fetching. The `error` variable has type `unknown` but is used without runtime validation.

```svelte
{:catch error}
    <p>Something went wrong getting ephemerides data</p>
```

Most pages show a generic static string and ignore the error value entirely.

**Exceptions with raw error output (debug output exposed in production):**
- `routes/(apps)/clipboard/+page.svelte:46`: `<p>{JSON.stringify(error)}</p>`
- `routes/(apps)/webwatcher/+page.svelte:26`: same pattern

### Pattern B: Manual try/catch in event handlers

Used in form submission and action handlers:
- `personal-tracker/components/PasswordPrompt.svelte:11-41` - nested try/catch, specific messages
- `songbook/+page.svelte:59-79` - swallows error, shows toast with static message

### Pattern C: `.catch()` chains

Used in `clipboard/components/ClipboardForm.svelte:38`:
```typescript
getPageTitle(currentContent).then(t => extractedTitle = t).catch(() => extractedTitle = '');
```
Error silently ignored.

### Pattern D: `handleFormError()` utility

`front/src/lib/components/FormLayout/formErrorHandler.ts` - the only location that does typed error discrimination:

```typescript
export function handleFormError(error: unknown, action: string = 'created') {
    let errorMessage = (error as Error).message;  // ← unsafe cast

    if (error instanceof ApiError && error.code === 401) {
        errorMessage = 'Invalid logged in user';
    } else if (error instanceof UserLoggedOutError) {  // ← dead branch
        errorMessage = 'User is logged out';
    }

    toast.push(`<strong>Entry not ${action}</strong><br/> ${errorMessage}`, ...);
}
```

Used only in `clipboard/components/ClipboardForm.svelte:80`. Most form submissions don't use this utility.

### User-Facing Error Display

| Method | Components Using It | Notes |
|--------|--------------------|-|
| `<Notice>` component | HomeTracker, Ephemerides, Songbook | Structured display, error passed as prop |
| Toast notifications | ClipboardForm, Songbook | Persistent (duration: 0) red toasts |
| `<p>` with static text | Clipboard, WebWatcher | Generic; some use `JSON.stringify(error)` |
| Inline `{#if errorMessage}` | PersonalTracker | Component-local state |

---

## 7. Summary of Issues by Category

### Error Creation (Backend)

- **No shared base class.** Each module extends `Error` directly with no common ancestor that could carry HTTP status, error code, or other shared metadata.
- **Inline error definitions** in `sensorMetaData.ts`, `watchers.ts`, `board.ts` are undiscoverable and inconsistently located.
- **Generic `new Error()` throws** in several modules produce unmapped 500s that look identical to unexpected infrastructure failures.
- **Repeated DB duplicate-key catch blocks** (3 identical + 1 variant) should be extracted to a utility.
- **Inconsistent message formats** (SCREAMING_SNAKE, sentence case, interpolated strings) make client-side discrimination impossible without hardcoding strings.

### Error Filtering (Backend)

- **No per-endpoint error filtering.** All endpoints share one global `instanceof` chain. An endpoint cannot declare which of its errors are "expected" client errors vs. unexpected failures.
- **Tight coupling:** Adding a new error class requires editing `errors.middleware.ts` and its import list.
- **WebSocket errors** are not routed through the central handler.

### Error Response Format (Backend)

- **Single `{ message }` shape** for everything. No error code field to allow programmatic discrimination.
- **Input validation errors** embed a JSON string inside `message` rather than a structured field.
- **No request ID or correlation token** in error responses.

### SDK and Error Propagation (Frontend)

- **SDK does not use `ApiError`** - throws generic `Error` with status embedded in message string. Callers cannot distinguish HTTP 401 from HTTP 500 without parsing the message.
- **No global error handler configured** on the `APIClient` instance.
- **Two HTTP clients** (SDK fetch + superagent) with no unified error surface.

### Error Handling in Components (Frontend)

- **`JSON.stringify(error)` in production UI** on Clipboard and WebWatcher pages exposes raw error objects to users.
- **Unsafe `(error as Error).message` casts** in `formErrorHandler.ts` and `PasswordPrompt.svelte` - fails if the thrown value isn't an `Error` instance.
- **Dead code:** `UserLoggedOutError` branch in `formErrorHandler.ts` is unreachable.
- **Inconsistent display mechanisms** (Notice, toast, plain `<p>`) with no shared convention.
- **Most `{:catch}` blocks ignore the error value** and show generic static strings, making debugging impossible for users and operators.

---

## 8. Files Reference

| File | Role |
|------|------|
| `back/src/libs/middleware/errors.middleware.ts` | Central error handler - instanceof chain, HTTP response, Slack |
| `back/src/libs/middleware/apiPipeline.middleware.ts` | Wraps route handlers, calls next(error) |
| `back/src/libs/middleware/authAPIKey.middleware.ts` | ApiKeyError hierarchy with status codes |
| `back/src/libs/middleware/auth_passport.middleware.ts` | Session auth errors → Auth_* classes |
| `back/src/libs/routes/errors.ts` | Shared route-layer error classes |
| `back/src/libs/modules/auth/errors.ts` | Auth error classes |
| `back/src/libs/modules/cookbook/errors.ts` | Cookbook errors with local CustomError base |
| `back/src/libs/modules/ephemerides/services/errors.ts` | Range error classes |
| `back/src/libs/modules/webReader/errors.ts` | InvalidUrlError |
| `back/src/app.ts` | Middleware wiring, auth pipeline assembly |
| `front/src/vendor/statox-api/index.ts` | Auto-generated SDK (OpenAPI) |
| `front/src/lib/api/client2.ts` | Single shared APIClient instance |
| `front/src/lib/api/errors.ts` | ApiError class (underused) |
| `front/src/lib/auth/errors.ts` | UserLoggedOutError (legacy, dead code) |
| `front/src/lib/components/FormLayout/formErrorHandler.ts` | Only typed error discrimination on frontend |
