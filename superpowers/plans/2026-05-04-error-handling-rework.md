# Error Handling Rework - Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ad-hoc, coupled error handling system with a typed `AppError` hierarchy, per-endpoint client error declarations, systematic slog logging, and a consistent `{ httpStatus, code, reason? }` response format.

**Architecture:** A shared `AppError` base class carries a stable `ErrorCode` string and HTTP status. Routes declare `clientErrors: ErrorCode[]` — a whitelist of business error codes the endpoint is allowed to forward to the client. The error middleware becomes a simple two-branch check (`instanceof AppError` + whitelist lookup) instead of a 16-class `instanceof` chain. Infrastructure errors (auth, input validation) are always forwarded; handler errors only when whitelisted.

**Tech Stack:** TypeScript, Express, Mocha + Chai + Supertest, slog, existing test helper framework.

---

## Design Decisions

### Per-Endpoint Filtering: Error Codes, Not Messages

The user's initial instinct was to declare "error messages" for filtering with string comparison. **This is the right direction but the wrong anchor point.** Error messages are display text that may change for UX reasons; using them as identifiers creates fragile implicit coupling.

**Decision: routes declare stable `ErrorCode` constants, not messages.**

```typescript
// Route declares codes — no error class imports needed
clientErrors: ['ITEM_ALREADY_EXISTS', 'FILE_OR_CONTENT_REQUIRED']
```

Alternative considered: routes declare error class constructors (fully type-safe, refactor-safe). Rejected because route files are configuration objects — importing domain error classes into them recreates the coupling we're removing from the middleware. With a `BusinessErrorCode` union type, the TypeScript compiler catches typos at build time.

### Auth / Input Validation Errors Are Always Forwarded

Auth errors (`UNAUTHORIZED`, `FORBIDDEN_FOR_USER`, etc.) come from infrastructure middleware that runs before the route handler. Requiring every protected route to declare these in `clientErrors` would be massive boilerplate. These error codes are declared as `ALWAYS_CLIENT_ERRORS` in the middleware and forwarded unconditionally. This also eliminates the current hardcoded `/auth/me` Slack suppression hack — auth errors simply never notify Slack.

### Error Response Format

```json
{ "httpStatus": 400, "code": "ITEM_ALREADY_EXISTS", "reason": "optional human text" }
```

`httpStatus` in the body is intentional: it matches the HTTP response code and makes it easier for clients to handle the error object without inspecting the HTTP layer separately. `reason` is optional and human-readable.

---

## File Map

### New Files
| File | Purpose |
|------|---------|
| `back/src/libs/errors/AppError.ts` | Base error class carrying `code`, `httpStatus`, `reason` |
| `back/src/libs/errors/codes.ts` | `ErrorCode` union type — single source of truth for all error codes |
| `back/src/libs/errors/dbHelpers.ts` | `handleDuplicateEntry()` — extracts repeated MySQL ER_DUP_ENTRY pattern |
| `back/src/libs/modules/homeTracker/errors.ts` | `SensorDoesNotExistError` extracted from sensorMetaData.ts |
| `back/src/libs/modules/webWatcher/errors.ts` | `EntryAlreadyExistsError` extracted from watchers.ts |

### Modified Files
| File | Change |
|------|--------|
| `back/src/libs/modules/logging/types.ts` | Add `errorCode?: string` to `LoggableProperties` |
| `back/src/libs/routes/types.ts` | Add `clientErrors?: ErrorCode[]` to `BaseRouteCommon` |
| `back/src/app.ts` | Set `response.locals.route` as first per-route middleware |
| `back/src/libs/middleware/errors.middleware.ts` | Complete rewrite — AppError + clientErrors, no instanceof chain |
| `back/src/libs/middleware/apiPipeline.middleware.ts` | `OutputValidationError` extends `AppError` |
| `back/src/libs/middleware/authAPIKey.middleware.ts` | `ApiKeyError` hierarchy extends `AppError` |
| `back/src/libs/modules/auth/errors.ts` | `Auth_*` classes extend `AppError` |
| `back/src/libs/routes/errors.ts` | All shared route errors extend `AppError` |
| `back/src/libs/modules/cookbook/errors.ts` | Cookbook errors extend `AppError`, remove local `CustomError` |
| `back/src/libs/modules/ephemerides/services/errors.ts` | Range errors extend `AppError` |
| `back/src/libs/modules/webReader/errors.ts` | `InvalidUrlError` extends `AppError` |
| `back/src/libs/modules/homeTracker/services/sensorMetaData.ts` | Remove inline error class, import from `../errors.ts` |
| `back/src/libs/modules/webWatcher/watchers.ts` | Remove inline error class, use DB helper |
| `back/src/libs/routes/clipboard/addEntry.ts` | Add `clientErrors`, use DB helper |
| `back/src/libs/routes/reactor/addEntry.ts` | Add `clientErrors`, use DB helper |
| `back/src/libs/routes/reactor/getEntry.ts` | Add `clientErrors` |
| `back/src/libs/routes/clipboard/getAllEntries.ts` | Add `clientErrors` |
| `back/src/libs/routes/webReader/getPageTitle.ts` | Add `clientErrors` |
| `back/src/libs/routes/webWatcher/createWatcher.ts` | Add `clientErrors` |
| `back/src/libs/routes/ephemerides/getRange.ts` | Add `clientErrors` |
| `back/src/libs/routes/cookbook/addRecipe.ts` | Add `clientErrors`, use DB helper |
| `back/src/libs/routes/cookbook/getRecipe.ts` | Add `clientErrors` |
| `back/src/libs/routes/homeTracker/updateSensorMetadata.ts` | Add `clientErrors` |
| `back/tests/framework/routeHandler.test.ts` | Update error body assertions to new format |
| `back/tests/framework/auth2.test.ts` | Update error body assertions |
| `back/tests/routes/**/*.test.ts` | Update all 15 error body assertion sites |

---

## Task 1: AppError Base Class and ErrorCode Union Type

**Files:**
- Create: `back/src/libs/errors/AppError.ts`
- Create: `back/src/libs/errors/codes.ts`
- Test: No route test. Verify by TypeScript compilation (`npm run check` in `back/`).

- [ ] **Step 1: Create `codes.ts` with all error codes**

```typescript
// back/src/libs/errors/codes.ts

export const ERROR_CODES = [
    // Auth / session
    'UNAUTHORIZED',
    'FORBIDDEN_FOR_USER',
    'INVALID_SCOPE',
    // API Key
    'MISSING_API_KEY',
    'INVALID_AUTH_HEADER',
    'UNKNOWN_API_KEY',
    // Route-level business errors
    'ITEM_ALREADY_EXISTS',
    'ITEM_NOT_FOUND',
    'FILE_OR_CONTENT_REQUIRED',
    'ITEM_IS_EXPIRED',
    'TOO_MANY_ENTRIES',
    // Cookbook
    'DUPLICATE_INGREDIENT',
    'RECIPE_ID_NOT_FOUND',
    // Ephemerides
    'RANGE_TOO_LARGE',
    'RANGE_IS_INVALID',
    // WebReader
    'INVALID_URL',
    // HomeTracker
    'SENSOR_NAME_DOES_NOT_EXISTS',
    // WebWatcher
    'ENTRY_ALREADY_EXISTS',
    // System (not forwarded to client)
    'OUTPUT_VALIDATION_FAILED',
    'INTERNAL_SERVER_ERROR',
    'INPUT_VALIDATION_FAILED',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];
```

- [ ] **Step 2: Create `AppError.ts`**

```typescript
// back/src/libs/errors/AppError.ts

import { ErrorCode } from './codes.js';

export class AppError extends Error {
    readonly code: ErrorCode;
    readonly httpStatus: number;
    readonly reason?: string;

    constructor(params: { code: ErrorCode; httpStatus: number; reason?: string }) {
        super(params.code);
        this.code = params.code;
        this.httpStatus = params.httpStatus;
        this.reason = params.reason;
    }
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd back && npm run check`
Expected: passes with no errors.

- [ ] **Step 4: Commit**

```bash
git add back/src/libs/errors/AppError.ts back/src/libs/errors/codes.ts
git commit -m "feat(errors): add AppError base class and ErrorCode union type"
```

---

## Task 2: Extend LoggableProperties and Route Type

**Files:**
- Modify: `back/src/libs/modules/logging/types.ts`
- Modify: `back/src/libs/routes/types.ts`

- [ ] **Step 1: Add `errorCode` to `LoggableProperties`**

In `back/src/libs/modules/logging/types.ts`, find the `LoggableProperties` type (around line 1) and add:

```typescript
// Add this property inside LoggableProperties
errorCode?: string;
```

- [ ] **Step 2: Add `clientErrors` to `BaseRouteCommon` in `types.ts`**

In `back/src/libs/routes/types.ts`, add the import and extend the type:

```typescript
import { ErrorCode } from '../errors/codes.js';
```

Then in `BaseRouteCommon<Input, Output>`:

```typescript
type BaseRouteCommon<Input, Output> = {
    path: string;
    handler: RouteHandler<Input>;
    outputSchema: ApiJsonSchema;
    clientErrors?: ErrorCode[];       // ← add this line
    customResponseHandler?: (output: Output, res: Response) => void;
};
```

- [ ] **Step 3: Verify compilation**

Run: `cd back && npm run check`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add back/src/libs/modules/logging/types.ts back/src/libs/routes/types.ts
git commit -m "feat(errors): extend Route type with clientErrors and LoggableProperties with errorCode"
```

---

## Task 3: Set response.locals.route in app.ts

The error middleware needs to know which route object triggered the error so it can check `clientErrors`. Set it as the first per-route middleware.

**Files:**
- Modify: `back/src/app.ts`

- [ ] **Step 1: Locate the per-route middleware assembly in `app.ts`**

Open `back/src/app.ts`. Around line 75, there is a loop that builds a middleware pipeline per route. Find the line that calls `app.get()` / `app.post()` and the array of middleware passed to it.

- [ ] **Step 2: Add route-setting middleware as the first entry**

Before the auth middleware in each route's pipeline, insert a tiny inline middleware that stores the route:

```typescript
// Add this inline function before the auth middleware in the middleware array:
(_req: Request, res: Response, next: NextFunction) => {
    res.locals.route = route;
    next();
},
```

The result should look like this inside the route registration loop:

```typescript
const middlewarePipeline = [
    (_req: Request, res: Response, next: NextFunction) => {
        res.locals.route = route;
        next();
    },
    // ...existing auth middleware...
    // ...existing input validation...
    apiPipeline(route),
];
```

- [ ] **Step 3: Verify compilation**

Run: `cd back && npm run check`
Expected: passes.

- [ ] **Step 4: Run framework tests to ensure nothing breaks**

Run: `cd back && npm run tests:framework`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add back/src/app.ts
git commit -m "feat(errors): expose route object on res.locals for error middleware"
```

---

## Task 4: Migrate Auth Module Errors to AppError

**Files:**
- Modify: `back/src/libs/modules/auth/errors.ts`

Note: the auth routes do not need `clientErrors` — auth errors are always forwarded (see ALWAYS_CLIENT_ERRORS in Task 9). No route file changes in this task.

- [ ] **Step 1: Update `auth/errors.ts` to extend AppError**

```typescript
// back/src/libs/modules/auth/errors.ts
import { AppError } from '../../errors/AppError.js';

export class Auth_UnauthorizedError extends AppError {
    constructor() {
        super({ code: 'UNAUTHORIZED', httpStatus: 401 });
    }
}

export class Auth_ForbiddenForUserError extends AppError {
    constructor() {
        super({ code: 'FORBIDDEN_FOR_USER', httpStatus: 401 });
    }
}

export class Auth_InvalidScopeError extends AppError {
    constructor() {
        super({ code: 'INVALID_SCOPE', httpStatus: 401 });
    }
}
```

- [ ] **Step 2: Verify compilation and tests**

Run: `cd back && npm run check && npm run tests:framework`
Expected: all pass. The existing middleware's `instanceof Auth_UnauthorizedError` checks still work because the class still extends `Error` (through `AppError`).

- [ ] **Step 3: Commit**

```bash
git add back/src/libs/modules/auth/errors.ts
git commit -m "refactor(errors): migrate Auth_* errors to AppError"
```

---

## Task 5: Migrate ApiKeyError Hierarchy to AppError

**Files:**
- Modify: `back/src/libs/middleware/authAPIKey.middleware.ts`

- [ ] **Step 1: Update `ApiKeyError` and its subclasses**

Replace the current `ApiKeyError` block at the bottom of `back/src/libs/middleware/authAPIKey.middleware.ts`:

```typescript
// Replace everything from "export class ApiKeyError" to end of file:

import { AppError } from '../errors/AppError.js';

export class ApiKeyError extends AppError {}

export class MissingApiKeyError extends ApiKeyError {
    constructor() {
        super({ code: 'MISSING_API_KEY', httpStatus: 401 });
    }
}

export class InvalidAuthHeaderError extends ApiKeyError {
    constructor() {
        super({ code: 'INVALID_AUTH_HEADER', httpStatus: 401 });
    }
}

export class UnknownApiKeyError extends ApiKeyError {
    constructor() {
        super({ code: 'UNKNOWN_API_KEY', httpStatus: 403 });
    }
}
```

- [ ] **Step 2: Verify compilation and tests**

Run: `cd back && npm run check && npm run tests:framework`
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add back/src/libs/middleware/authAPIKey.middleware.ts
git commit -m "refactor(errors): migrate ApiKeyError hierarchy to AppError"
```

---

## Task 6: Migrate OutputValidationError to AppError

**Files:**
- Modify: `back/src/libs/middleware/apiPipeline.middleware.ts`

- [ ] **Step 1: Update `OutputValidationError` to extend AppError**

In `back/src/libs/middleware/apiPipeline.middleware.ts`, replace:

```typescript
export class OutputValidationError extends Error {
    constructor() {
        super('OUTPUT_VALIDATION_FAILED');
    }
}
```

With:

```typescript
import { AppError } from '../errors/AppError.js';

export class OutputValidationError extends AppError {
    constructor() {
        super({ code: 'OUTPUT_VALIDATION_FAILED', httpStatus: 500 });
    }
}
```

- [ ] **Step 2: Verify compilation and tests**

Run: `cd back && npm run check && npm run tests:framework`
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add back/src/libs/middleware/apiPipeline.middleware.ts
git commit -m "refactor(errors): migrate OutputValidationError to AppError"
```

---

## Task 7: Migrate Shared Route Errors + Declare clientErrors

**Files:**
- Modify: `back/src/libs/routes/errors.ts`
- Modify: `back/src/libs/routes/clipboard/addEntry.ts`
- Modify: `back/src/libs/routes/clipboard/getAllEntries.ts`
- Modify: `back/src/libs/routes/reactor/addEntry.ts`
- Modify: `back/src/libs/routes/reactor/getEntry.ts`

These are the errors currently in `routes/errors.ts` used by clipboard, reactor, and potentially others.

- [ ] **Step 1: Update `routes/errors.ts`**

```typescript
// back/src/libs/routes/errors.ts
import { AppError } from '../errors/AppError.js';

export class FileOrContentRequiredError extends AppError {
    constructor() {
        super({ code: 'FILE_OR_CONTENT_REQUIRED', httpStatus: 400 });
    }
}

export class ItemAlreadyExistsError extends AppError {
    constructor() {
        super({ code: 'ITEM_ALREADY_EXISTS', httpStatus: 400 });
    }
}

export class ItemNotFoundError extends AppError {
    constructor() {
        super({ code: 'ITEM_NOT_FOUND', httpStatus: 400 });
    }
}

export class ExpiredItemError extends AppError {
    constructor() {
        super({ code: 'ITEM_IS_EXPIRED', httpStatus: 400 });
    }
}

export class TooManyEntriesError extends AppError {
    constructor() {
        super({ code: 'TOO_MANY_ENTRIES', httpStatus: 400 });
    }
}
```

- [ ] **Step 2: Add `clientErrors` to `clipboard/addEntry.ts`**

In `back/src/libs/routes/clipboard/addEntry.ts`, add to the route object:

```typescript
clientErrors: ['FILE_OR_CONTENT_REQUIRED', 'ITEM_ALREADY_EXISTS'],
```

- [ ] **Step 3: Add `clientErrors` to `clipboard/getAllEntries.ts`**

Add to the route object:

```typescript
clientErrors: ['ITEM_NOT_FOUND'],
```

- [ ] **Step 4: Add `clientErrors` to `reactor/addEntry.ts`**

Add to the route object:

```typescript
clientErrors: ['ITEM_ALREADY_EXISTS'],
```

- [ ] **Step 5: Add `clientErrors` to `reactor/getEntry.ts`**

Add to the route object:

```typescript
clientErrors: ['ITEM_NOT_FOUND'],
```

- [ ] **Step 6: Verify compilation and tests**

Run: `cd back && npm run check && npm run tests`
Expected: all pass. (The old middleware still uses instanceof checks which still work.)

- [ ] **Step 7: Commit**

```bash
git add back/src/libs/routes/errors.ts \
        back/src/libs/routes/clipboard/addEntry.ts \
        back/src/libs/routes/clipboard/getAllEntries.ts \
        back/src/libs/routes/reactor/addEntry.ts \
        back/src/libs/routes/reactor/getEntry.ts
git commit -m "refactor(errors): migrate shared route errors to AppError, declare clientErrors on clipboard and reactor routes"
```

---

## Task 8: Migrate Cookbook Errors + Declare clientErrors

**Files:**
- Modify: `back/src/libs/modules/cookbook/errors.ts`
- Modify: `back/src/libs/routes/cookbook/addRecipe.ts`
- Modify: `back/src/libs/routes/cookbook/getRecipe.ts`

- [ ] **Step 1: Update `cookbook/errors.ts`**

```typescript
// back/src/libs/modules/cookbook/errors.ts
import { AppError } from '../../errors/AppError.js';

export class DuplicateIngredientError extends AppError {
    readonly ingredient: string;
    constructor(ingredient: string) {
        super({
            code: 'DUPLICATE_INGREDIENT',
            httpStatus: 400,
            reason: `Ingredient "${ingredient}" appears more than once`
        });
        this.ingredient = ingredient;
    }
}

export class RecipeNotFoundError extends AppError {
    readonly id: number;
    constructor(id: number) {
        super({ code: 'RECIPE_ID_NOT_FOUND', httpStatus: 400 });
        this.id = id;
    }
}
```

- [ ] **Step 2: Add `clientErrors` to `cookbook/addRecipe.ts`**

```typescript
clientErrors: ['ITEM_ALREADY_EXISTS', 'DUPLICATE_INGREDIENT'],
```

- [ ] **Step 3: Add `clientErrors` to `cookbook/getRecipe.ts`**

```typescript
clientErrors: ['RECIPE_ID_NOT_FOUND'],
```

- [ ] **Step 4: Verify**

Run: `cd back && npm run check && npm run tests`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add back/src/libs/modules/cookbook/errors.ts \
        back/src/libs/routes/cookbook/addRecipe.ts \
        back/src/libs/routes/cookbook/getRecipe.ts
git commit -m "refactor(errors): migrate cookbook errors to AppError, declare clientErrors"
```

---

## Task 9: Migrate Ephemerides and WebReader Errors + Declare clientErrors

**Files:**
- Modify: `back/src/libs/modules/ephemerides/services/errors.ts`
- Modify: `back/src/libs/routes/ephemerides/getRange.ts`
- Modify: `back/src/libs/modules/webReader/errors.ts`
- Modify: `back/src/libs/routes/webReader/getPageTitle.ts`

- [ ] **Step 1: Update `ephemerides/services/errors.ts`**

```typescript
// back/src/libs/modules/ephemerides/services/errors.ts
import { AppError } from '../../../errors/AppError.js';

export class RangeTooLargeError extends AppError {
    constructor() {
        super({ code: 'RANGE_TOO_LARGE', httpStatus: 400 });
    }
}

export class RangeInvalid extends AppError {
    constructor() {
        super({ code: 'RANGE_IS_INVALID', httpStatus: 400 });
    }
}
```

- [ ] **Step 2: Add `clientErrors` to `ephemerides/getRange.ts`**

```typescript
clientErrors: ['RANGE_TOO_LARGE', 'RANGE_IS_INVALID'],
```

- [ ] **Step 3: Update `webReader/errors.ts`**

```typescript
// back/src/libs/modules/webReader/errors.ts
import { AppError } from '../../errors/AppError.js';

export class InvalidUrlError extends AppError {
    constructor() {
        super({ code: 'INVALID_URL', httpStatus: 400 });
    }
}
```

- [ ] **Step 4: Add `clientErrors` to `webReader/getPageTitle.ts`**

```typescript
clientErrors: ['INVALID_URL'],
```

- [ ] **Step 5: Verify**

Run: `cd back && npm run check && npm run tests`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add back/src/libs/modules/ephemerides/services/errors.ts \
        back/src/libs/routes/ephemerides/getRange.ts \
        back/src/libs/modules/webReader/errors.ts \
        back/src/libs/routes/webReader/getPageTitle.ts
git commit -m "refactor(errors): migrate ephemerides and webReader errors to AppError"
```

---

## Task 10: Extract and Migrate Inline Errors (homeTracker, webWatcher)

These two error classes are defined inline in service/module files. Extract them to proper `errors.ts` files.

**Files:**
- Create: `back/src/libs/modules/homeTracker/errors.ts`
- Modify: `back/src/libs/modules/homeTracker/services/sensorMetaData.ts`
- Modify: `back/src/libs/routes/homeTracker/updateSensorMetadata.ts`
- Create: `back/src/libs/modules/webWatcher/errors.ts`
- Modify: `back/src/libs/modules/webWatcher/watchers.ts`
- Modify: `back/src/libs/routes/webWatcher/createWatcher.ts`

- [ ] **Step 1: Create `homeTracker/errors.ts`**

```typescript
// back/src/libs/modules/homeTracker/errors.ts
import { AppError } from '../../errors/AppError.js';

export class SensorDoesNotExistError extends AppError {
    constructor() {
        super({ code: 'SENSOR_NAME_DOES_NOT_EXISTS', httpStatus: 400 });
    }
}
```

- [ ] **Step 2: Update `sensorMetaData.ts` to import from errors.ts**

In `back/src/libs/modules/homeTracker/services/sensorMetaData.ts`:
- Remove the inline `SensorDoesNotExistError` class definition
- Add import: `import { SensorDoesNotExistError } from '../errors.js';`

- [ ] **Step 3: Add `clientErrors` to `homeTracker/updateSensorMetadata.ts`**

```typescript
clientErrors: ['SENSOR_NAME_DOES_NOT_EXISTS'],
```

- [ ] **Step 4: Create `webWatcher/errors.ts`**

```typescript
// back/src/libs/modules/webWatcher/errors.ts
import { AppError } from '../../errors/AppError.js';

export class EntryAlreadyExistsError extends AppError {
    constructor() {
        super({ code: 'ENTRY_ALREADY_EXISTS', httpStatus: 400 });
    }
}
```

- [ ] **Step 5: Update `watchers.ts` to import from errors.ts**

In `back/src/libs/modules/webWatcher/watchers.ts`:
- Remove the inline `EntryAlreadyExistsError` class definition
- Add import: `import { EntryAlreadyExistsError } from './errors.js';`

- [ ] **Step 6: Check and update any re-exports in `webWatcher/index.ts`**

If `webWatcher/index.ts` currently re-exports `EntryAlreadyExistsError` from `watchers.ts`, update it to re-export from `./errors.js` instead.

- [ ] **Step 7: Add `clientErrors` to `webWatcher/createWatcher.ts`**

```typescript
clientErrors: ['ENTRY_ALREADY_EXISTS'],
```

- [ ] **Step 8: Verify**

Run: `cd back && npm run check && npm run tests`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add back/src/libs/modules/homeTracker/errors.ts \
        back/src/libs/modules/homeTracker/services/sensorMetaData.ts \
        back/src/libs/routes/homeTracker/updateSensorMetadata.ts \
        back/src/libs/modules/webWatcher/errors.ts \
        back/src/libs/modules/webWatcher/watchers.ts \
        back/src/libs/routes/webWatcher/createWatcher.ts
git commit -m "refactor(errors): extract inline error classes to errors.ts files, declare clientErrors"
```

---

## Task 11: Rewrite Error Middleware

**All error classes now extend `AppError`. All routes that throw business errors declare `clientErrors`. Now replace the middleware.**

**Files:**
- Modify: `back/src/libs/middleware/errors.middleware.ts`

- [ ] **Step 1: Write the new error middleware**

Replace the entire content of `back/src/libs/middleware/errors.middleware.ts`:

```typescript
import { NextFunction, Request, Response } from 'express';
import { ValidationError } from 'express-json-validator-middleware';
import { AppError } from '../errors/AppError.js';
import { ErrorCode } from '../errors/codes.js';
import { Route } from '../routes/types.js';
import { slackNotifier } from '../modules/notifier/slack.js';
import { slog } from '../modules/logging/slog.js';

// Auth and infrastructure errors are always forwarded to the client.
// They come from middleware that runs before route handlers, so routes
// cannot (and should not need to) whitelist them individually.
const ALWAYS_CLIENT_ERRORS = new Set<ErrorCode>([
    'UNAUTHORIZED',
    'FORBIDDEN_FOR_USER',
    'INVALID_SCOPE',
    'MISSING_API_KEY',
    'INVALID_AUTH_HEADER',
    'UNKNOWN_API_KEY',
]);

type ErrorResponse = {
    httpStatus: number;
    code: ErrorCode;
    reason?: string;
};

export const errorHandler = async (
    error: Error,
    request: Request,
    response: Response,
    next: NextFunction
) => {
    const route = response.locals.route as Route<unknown, unknown> | undefined;

    response.locals.loggableContext?.addData('error', error);

    // Input validation errors from express-json-validator-middleware
    if (error instanceof ValidationError) {
        slog.log('middleware', 'Input validation error', { url: request.url });
        const body: ErrorResponse = {
            httpStatus: 400,
            code: 'INPUT_VALIDATION_FAILED',
            reason: JSON.stringify(error.validationErrors),
        };
        return response.status(400).json(body);
    }

    // All AppErrors (business, auth, system)
    if (error instanceof AppError) {
        const isAlwaysForwarded = ALWAYS_CLIENT_ERRORS.has(error.code);
        const isDeclaredByRoute = Boolean(route?.clientErrors?.includes(error.code));
        const isClientError = isAlwaysForwarded || isDeclaredByRoute;

        slog.log('middleware', isClientError ? 'Client error' : 'Unexpected AppError', {
            url: request.url,
            error,
            errorCode: error.code,
        });

        if (!isClientError) {
            slackNotifier.notifySlack({
                error,
                message: `Unexpected AppError ${error.code} on ${request.url}`,
            });
            return response.status(500).json({
                httpStatus: 500,
                code: 'INTERNAL_SERVER_ERROR',
            } satisfies ErrorResponse);
        }

        const body: ErrorResponse = { httpStatus: error.httpStatus, code: error.code };
        if (error.reason) body.reason = error.reason;
        return response.status(error.httpStatus).json(body);
    }

    // Unrecognized error — unknown failure
    slog.log('middleware', 'Unexpected error', { url: request.url, error });
    slackNotifier.notifySlack({ error, message: `Unexpected error on ${request.url}` });
    response.status(500).json({
        httpStatus: 500,
        code: 'INTERNAL_SERVER_ERROR',
    } satisfies ErrorResponse);
    next();
};
```

- [ ] **Step 2: Verify compilation**

Run: `cd back && npm run check`
Expected: passes. Note: any remaining imports in the old middleware file are now removed — if the compiler flags unused imports from the old file, they are gone.

- [ ] **Step 3: Run tests and expect failures in error-body assertions**

Run: `cd back && npm run tests`
Expected: route tests that check error response bodies will fail (they expect `{ message: '...' }` but now receive `{ httpStatus: ..., code: '...' }`). Framework tests for the error handler will also fail. **This is expected — Task 12 fixes all assertions.**

- [ ] **Step 4: Also run framework tests**

Run: `cd back && npm run tests:framework`
Expected: `routeHandler.test.ts` tests for error responses will fail.

- [ ] **Step 5: Commit the middleware (before fixing tests)**

```bash
git add back/src/libs/middleware/errors.middleware.ts
git commit -m "feat(errors): rewrite error middleware using AppError + clientErrors whitelist"
```

---

## Task 12: Update All Test Assertions to New Error Format

The error response changed from `{ message: 'CODE' }` to `{ httpStatus: N, code: 'CODE' }`. Update every assertion site. There are 17 known sites.

**Files:** (all test files)

- [ ] **Step 1: Update `tests/framework/routeHandler.test.ts`**

Line 30 — generic 500:
```typescript
// Old:
assert.deepEqual(response.body, { message: 'Internal Server Error' });
// New:
assert.deepEqual(response.body, { httpStatus: 500, code: 'INTERNAL_SERVER_ERROR' });
```

Line 39 — output validation 500:
```typescript
// Old:
assert.deepEqual(response.body, { message: 'Failed output validation' });
// New:
assert.deepEqual(response.body, { httpStatus: 500, code: 'OUTPUT_VALIDATION_FAILED' });
```

- [ ] **Step 2: Update `tests/framework/auth2.test.ts`**

Line 122 — UNAUTHORIZED body:
```typescript
// Old:
message: 'UNAUTHORIZED'
// New:
httpStatus: 401,
code: 'UNAUTHORIZED'
```

- [ ] **Step 3: Update `tests/routes/clipboard/addEntry.test.ts`**

Line 18:
```typescript
// Old:
assert.equal(response.text, '{"message":"FILE_OR_CONTENT_REQUIRED"}');
// New:
assert.deepEqual(response.body, { httpStatus: 400, code: 'FILE_OR_CONTENT_REQUIRED' });
```

Lines 46 and 87:
```typescript
// Old:
assert.equal(response.text, '{"message":"ITEM_ALREADY_EXISTS"}');
// New:
assert.deepEqual(response.body, { httpStatus: 400, code: 'ITEM_ALREADY_EXISTS' });
```

- [ ] **Step 4: Update `tests/routes/clipboard/getAllEntries.test.ts`**

Line 29:
```typescript
// Old:
assert.equal(response.text, '{"message":"ITEM_NOT_FOUND"}');
// New:
assert.deepEqual(response.body, { httpStatus: 400, code: 'ITEM_NOT_FOUND' });
```

- [ ] **Step 5: Update `tests/routes/reactor/addEntry.test.ts`**

Line 30:
```typescript
// Old:
assert.equal(response.text, '{"message":"ITEM_ALREADY_EXISTS"}');
// New:
assert.deepEqual(response.body, { httpStatus: 400, code: 'ITEM_ALREADY_EXISTS' });
```

- [ ] **Step 6: Update `tests/routes/reactor/getEntry.test.ts`**

Lines 49 and 72:
```typescript
// Old:
assert.equal(response.text, '{"message":"ITEM_NOT_FOUND"}');
// New:
assert.deepEqual(response.body, { httpStatus: 400, code: 'ITEM_NOT_FOUND' });
```

- [ ] **Step 7: Update `tests/routes/webReader/getPageTitle.test.ts`**

Line 39:
```typescript
// Old:
assert.deepEqual(response.body, { message: 'INVALID_URL' });
// New:
assert.deepEqual(response.body, { httpStatus: 400, code: 'INVALID_URL' });
```

Also update the input validation test (line 24) where the match pattern checks for `must have required property 'url'`. The field is now in `reason`:
```typescript
// Old:
assert.match(JSON.stringify(response.body), new RegExp("must have required property 'url'"));
// New:
assert.match(response.body.reason, /must have required property 'url'/);
```

- [ ] **Step 8: Update `tests/routes/webWatcher/createWatcher/createWatcher.test.ts`**

Line 40:
```typescript
// Old:
assert.deepEqual(response.body, { message: 'ENTRY_ALREADY_EXISTS' });
// New:
assert.deepEqual(response.body, { httpStatus: 400, code: 'ENTRY_ALREADY_EXISTS' });
```

- [ ] **Step 9: Update `tests/routes/ephemerides/getRange/getRange.test.ts`**

Lines 52 and 66:
```typescript
// Old:
assert.equal(response.text, '{"message":"RANGE_IS_INVALID"}');
// New:
assert.deepEqual(response.body, { httpStatus: 400, code: 'RANGE_IS_INVALID' });

// Old:
assert.equal(response.text, '{"message":"RANGE_TOO_LARGE"}');
// New:
assert.deepEqual(response.body, { httpStatus: 400, code: 'RANGE_TOO_LARGE' });
```

- [ ] **Step 10: Update `tests/routes/cookbook/addRecipe/addRecipe.test.ts`**

Line 23:
```typescript
// Old:
assert.equal(response.text, '{"message":"ITEM_ALREADY_EXISTS"}');
// New:
assert.deepEqual(response.body, { httpStatus: 400, code: 'ITEM_ALREADY_EXISTS' });
```

- [ ] **Step 11: Update `tests/routes/cookbook/getRecipe/getRecipe.test.ts`**

Line 18:
```typescript
// Old:
assert.equal(response.text, '{"message":"RECIPE_ID_NOT_FOUND"}');
// New:
assert.deepEqual(response.body, { httpStatus: 400, code: 'RECIPE_ID_NOT_FOUND' });
```

- [ ] **Step 12: Update `tests/routes/homeTracker/updateSensorMetadata/updateSensorMetadata.test.ts`**

Line 79:
```typescript
// Old:
assert.deepEqual(res.body, { message: 'SENSOR_NAME_DOES_NOT_EXISTS' });
// New:
assert.deepEqual(res.body, { httpStatus: 400, code: 'SENSOR_NAME_DOES_NOT_EXISTS' });
```

- [ ] **Step 13: Run full test suite**

Run: `cd back && npm run tests:all`
Expected: all pass.

- [ ] **Step 14: Commit**

```bash
git add back/tests/
git commit -m "test(errors): update all error body assertions to new { httpStatus, code } format"
```

---

## Task 13: DB Duplicate Key Helper + Refactor Callers

Extract the repeated MySQL `ER_DUP_ENTRY` catch pattern into a shared utility.

**Files:**
- Create: `back/src/libs/errors/dbHelpers.ts`
- Modify: `back/src/libs/routes/clipboard/addEntry.ts` (or `back/src/libs/modules/clipboard/addEntry.ts` — wherever the try/catch lives)
- Modify: `back/src/libs/routes/reactor/addEntry.ts` (or module)
- Modify: `back/src/libs/modules/cookbook/services/addRecipe.ts`
- Modify: `back/src/libs/modules/webWatcher/watchers.ts`

- [ ] **Step 1: Create `dbHelpers.ts`**

```typescript
// back/src/libs/errors/dbHelpers.ts
import { QueryError } from 'mysql2';
import { AppError } from './AppError.js';
import { ErrorCode } from './codes.js';

/**
 * Re-throws as AppError when MySQL signals a duplicate key violation (ER_DUP_ENTRY).
 * Otherwise re-throws the original error unchanged.
 */
export function handleDuplicateEntry(error: unknown, code: ErrorCode): never {
    if ((error as QueryError).code === 'ER_DUP_ENTRY') {
        throw new AppError({ code, httpStatus: 400 });
    }
    throw error as Error;
}
```

- [ ] **Step 2: Update clipboard duplicate key handling**

Find the try/catch in the clipboard addEntry service. Replace:

```typescript
catch (error) {
    if ((error as QueryError).code === 'ER_DUP_ENTRY') {
        throw new ItemAlreadyExistsError();
    }
    throw error;
}
```

With:

```typescript
import { handleDuplicateEntry } from '../../errors/dbHelpers.js';

// ...
catch (error) {
    handleDuplicateEntry(error, 'ITEM_ALREADY_EXISTS');
}
```

- [ ] **Step 3: Update reactor duplicate key handling**

Apply the same replacement in the reactor addEntry service (same pattern, same `'ITEM_ALREADY_EXISTS'` code).

- [ ] **Step 4: Update cookbook duplicate key handling**

In `back/src/libs/modules/cookbook/services/addRecipe.ts`, replace:

```typescript
catch (error) {
    await conn.rollback();
    if ((error as QueryError).code === 'ER_DUP_ENTRY') {
        throw new ItemAlreadyExistsError();
    }
    throw error;
}
```

With:

```typescript
import { handleDuplicateEntry } from '../../../errors/dbHelpers.js';

// ...
catch (error) {
    await conn.rollback();
    handleDuplicateEntry(error, 'ITEM_ALREADY_EXISTS');
}
```

- [ ] **Step 5: Update webWatcher duplicate key handling**

In `back/src/libs/modules/webWatcher/watchers.ts`, replace:

```typescript
catch (error) {
    if ((error as QueryError).code === 'ER_DUP_ENTRY') {
        throw new EntryAlreadyExistsError();
    }
    throw error;
}
```

With:

```typescript
import { handleDuplicateEntry } from '../../errors/dbHelpers.js';

// ...
catch (error) {
    handleDuplicateEntry(error, 'ENTRY_ALREADY_EXISTS');
}
```

- [ ] **Step 6: Run full test suite**

Run: `cd back && npm run tests:all`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add back/src/libs/errors/dbHelpers.ts \
        back/src/libs/modules/clipboard/ \
        back/src/libs/modules/reactor/ \
        back/src/libs/modules/cookbook/ \
        back/src/libs/modules/webWatcher/
git commit -m "refactor(errors): extract repeated ER_DUP_ENTRY handling into handleDuplicateEntry helper"
```

---

## Final Verification

- [ ] Run `cd back && npm run tests:all` — all suites pass
- [ ] Run `cd back && npm run check` — lint + types clean
- [ ] Manually verify a 400 response matches `{ httpStatus: 400, code: '...', reason?: '...' }`
- [ ] Verify a 500 response matches `{ httpStatus: 500, code: 'INTERNAL_SERVER_ERROR' }`
- [ ] Confirm Slack notifier is NOT called for client errors (check `th.slack.checkNoNotifications()` in relevant tests)

---

## SDK / Frontend Impact (Out of Scope for This Plan)

The SDK is auto-generated from route output schemas. Error responses are not in the route output schemas, so the SDK itself does not change.

**What will need updating on the frontend after this plan ships:**

1. The `APIClient` fetch method in `vendor/statox-api/index.ts` constructs a generic `Error` from `HTTP ${status}: ${statusText}`. It should instead parse the response body and construct an `ApiError(code, httpStatus, reason)` — making the structured code available to callers without parsing message strings.

2. `front/src/lib/components/FormLayout/formErrorHandler.ts` checks `error.code === 401` (numeric HTTP status). With the new format it should check `error.code === 'UNAUTHORIZED'` (string code).

3. The `UserLoggedOutError` branch in `formErrorHandler.ts` is dead code and can be deleted.

4. `JSON.stringify(error)` in `clipboard/+page.svelte` and `webwatcher/+page.svelte` should be replaced with `error.reason ?? error.code`.
