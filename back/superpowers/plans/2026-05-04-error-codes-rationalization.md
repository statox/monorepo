# Error Code Rationalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove duplicate error codes, fix bad naming, and move all error classes out of `routes/errors.ts` into their proper module `errors.ts` files.

**Architecture:** Four independent renames/merges (one per duplicate code pair), then a structural cleanup that deletes `routes/errors.ts` and creates two new module-level `errors.ts` files (`clipboard` and `s3files`). Each task is self-contained: update the code, update the test, verify, commit. The test suite that validates this work is `npm run tests:framework` (runs against compiled `dist/` — always recompile with `npx tsc` before running tests).

**Tech Stack:** TypeScript, Express, Mocha + Chai + Supertest, MySQL. All imports use `.js` extensions for `.ts` source files (ES Modules). Error classes extend `AppError` from `src/libs/errors/AppError.ts`. Error codes are string literals registered in `src/libs/errors/codes.ts`.

---

## File Structure

**Files to CREATE:**
- `back/src/libs/modules/clipboard/errors.ts` — `FileOrContentRequiredError`
- `back/src/libs/modules/s3files/errors.ts` — `ItemNotFoundError`, `TooManyEntriesError`, `ExpiredItemError`

**Files to DELETE:**
- `back/src/libs/routes/errors.ts` — redistributed to module `errors.ts` files above
- `back/src/libs/modules/webWatcher/errors.ts` — `EntryAlreadyExistsError` has no callers (all duplicate-entry throw sites use `handleDuplicateEntry` with the code string directly)

**Files to MODIFY:**
- `back/src/libs/errors/codes.ts` — remove `ENTRY_ALREADY_EXISTS`, `RECIPE_ID_NOT_FOUND`, `SENSOR_NAME_DOES_NOT_EXISTS`; add `SENSOR_NOT_FOUND`
- `back/src/libs/modules/cookbook/errors.ts` — `RecipeNotFoundError`: change code from `RECIPE_ID_NOT_FOUND` to `ITEM_NOT_FOUND`
- `back/src/libs/modules/homeTracker/errors.ts` — rename class `SensorDoesNotExistError` → `SensorNotFoundError`, change code `SENSOR_NAME_DOES_NOT_EXISTS` → `SENSOR_NOT_FOUND`
- `back/src/libs/modules/homeTracker/services/sensorMetaData.ts` — update import of renamed class
- `back/src/libs/modules/webWatcher/watchers.ts` — change `handleDuplicateEntry` code arg from `ENTRY_ALREADY_EXISTS` to `ITEM_ALREADY_EXISTS`
- `back/src/libs/modules/webWatcher/index.ts` — remove `export * from './errors.js'`
- `back/src/libs/modules/s3files/index.ts` — import errors from `./errors.js` instead of `../../routes/errors.js`
- `back/src/libs/modules/reactor/getEntries.ts` — import errors from `../s3files/errors.js` instead of `../../routes/errors.js`
- `back/src/libs/routes/clipboard/addEntry.ts` — import `FileOrContentRequiredError` from `../../modules/clipboard/errors.js`
- `back/src/libs/routes/webWatcher/createWatcher.ts` — `clientErrors: ['ITEM_ALREADY_EXISTS']`
- `back/src/libs/routes/cookbook/getRecipe.ts` — `clientErrors: ['ITEM_NOT_FOUND']`
- `back/src/libs/routes/homeTracker/updateSensorMetadata.ts` — `clientErrors: ['SENSOR_NOT_FOUND']`

**Tests to MODIFY:**
- `back/tests/routes/webWatcher/createWatcher/createWatcher.test.ts` — `ENTRY_ALREADY_EXISTS` → `ITEM_ALREADY_EXISTS`
- `back/tests/routes/cookbook/getRecipe/getRecipe.test.ts` — `RECIPE_ID_NOT_FOUND` → `ITEM_NOT_FOUND`
- `back/tests/routes/homeTracker/updateSensorMetadata/updateSensorMetadata.test.ts` — `SENSOR_NAME_DOES_NOT_EXISTS` → `SENSOR_NOT_FOUND`

---

## Task 1: Merge `ENTRY_ALREADY_EXISTS` → `ITEM_ALREADY_EXISTS`

`ENTRY_ALREADY_EXISTS` (webWatcher) and `ITEM_ALREADY_EXISTS` (clipboard, reactor, cookbook) mean the same thing. webWatcher is the single outlier — merge it into the canonical code.

**Files:**
- Modify: `back/src/libs/errors/codes.ts`
- Modify: `back/src/libs/modules/webWatcher/watchers.ts`
- Modify: `back/src/libs/modules/webWatcher/index.ts`
- Delete: `back/src/libs/modules/webWatcher/errors.ts`
- Modify: `back/src/libs/routes/webWatcher/createWatcher.ts:107`
- Test: `back/tests/routes/webWatcher/createWatcher/createWatcher.test.ts`

- [ ] **Step 1: Update the test assertion**

In `back/tests/routes/webWatcher/createWatcher/createWatcher.test.ts`, the `on duplicate entry` test currently asserts `code: 'ENTRY_ALREADY_EXISTS'`. Change it to `ITEM_ALREADY_EXISTS`:

```typescript
// around line 40
assert.deepEqual(response.body, {
    httpStatus: 400,
    code: 'ITEM_ALREADY_EXISTS'
});
```

- [ ] **Step 2: Compile and verify the test currently fails**

```bash
cd back && npx tsc && npm run tests -- -f 'createWatcher'
```

Expected: the `on duplicate entry` test fails with `AssertionError: expected { code: 'ENTRY_ALREADY_EXISTS' } to deeply equal { code: 'ITEM_ALREADY_EXISTS' }`. All other createWatcher tests pass.

- [ ] **Step 3: Remove `ENTRY_ALREADY_EXISTS` from `codes.ts`**

In `back/src/libs/errors/codes.ts`, remove the `ENTRY_ALREADY_EXISTS` line and its comment:

```typescript
// before (lines 29-31):
    // WebWatcher
    'ENTRY_ALREADY_EXISTS',
// after: delete both lines entirely
```

The `ERROR_CODES` array should no longer contain `'ENTRY_ALREADY_EXISTS'`.

- [ ] **Step 4: Update `watchers.ts` to use `ITEM_ALREADY_EXISTS`**

In `back/src/libs/modules/webWatcher/watchers.ts`, change the `handleDuplicateEntry` call:

```typescript
// before:
        handleDuplicateEntry(error, 'ENTRY_ALREADY_EXISTS');
// after:
        handleDuplicateEntry(error, 'ITEM_ALREADY_EXISTS');
```

- [ ] **Step 5: Update `createWatcher.ts` route's `clientErrors`**

In `back/src/libs/routes/webWatcher/createWatcher.ts`, change:

```typescript
// before:
    clientErrors: ['ENTRY_ALREADY_EXISTS'],
// after:
    clientErrors: ['ITEM_ALREADY_EXISTS'],
```

- [ ] **Step 6: Remove the `errors.ts` re-export from `webWatcher/index.ts`**

`EntryAlreadyExistsError` has no callers — all throw sites use `handleDuplicateEntry` with the code string. Remove the re-export from `back/src/libs/modules/webWatcher/index.ts`:

```typescript
// before:
export * from './checks.js';
export * from './errors.js';
export * from './types.js';
export * from './watchers.js';

// after:
export * from './checks.js';
export * from './types.js';
export * from './watchers.js';
```

- [ ] **Step 7: Delete `back/src/libs/modules/webWatcher/errors.ts`**

```bash
rm back/src/libs/modules/webWatcher/errors.ts
```

- [ ] **Step 8: Compile and verify the test passes**

```bash
cd back && npx tsc && npm run tests -- -f 'createWatcher'
```

Expected: all createWatcher tests pass.

- [ ] **Step 9: Run the full framework suite**

```bash
cd back && npm run tests:framework
```

Expected: 41 passing.

- [ ] **Step 10: Check formatting**

```bash
cd back && npm run check
```

Expected: no lint or prettier errors.

- [ ] **Step 11: Commit**

```bash
cd back && git add \
  src/libs/errors/codes.ts \
  src/libs/modules/webWatcher/watchers.ts \
  src/libs/modules/webWatcher/index.ts \
  src/libs/routes/webWatcher/createWatcher.ts \
  tests/routes/webWatcher/createWatcher/createWatcher.test.ts && \
git rm src/libs/modules/webWatcher/errors.ts && \
git commit -m "refactor(errors): merge ENTRY_ALREADY_EXISTS into ITEM_ALREADY_EXISTS"
```

---

## Task 2: Merge `RECIPE_ID_NOT_FOUND` → `ITEM_NOT_FOUND`

`RECIPE_ID_NOT_FOUND` is an overly specific code for a generic concept. The class `RecipeNotFoundError` can keep its descriptive name; only the wire-format code changes to the canonical `ITEM_NOT_FOUND`.

**Files:**
- Modify: `back/src/libs/errors/codes.ts`
- Modify: `back/src/libs/modules/cookbook/errors.ts`
- Modify: `back/src/libs/routes/cookbook/getRecipe.ts`
- Test: `back/tests/routes/cookbook/getRecipe/getRecipe.test.ts`

- [ ] **Step 1: Update the test assertion**

In `back/tests/routes/cookbook/getRecipe/getRecipe.test.ts`, change the `code` in the deepEqual:

```typescript
// before:
assert.deepEqual(response.body, {
    httpStatus: 400,
    code: 'RECIPE_ID_NOT_FOUND',
    reason: 'Recipe 99 not found'
});

// after:
assert.deepEqual(response.body, {
    httpStatus: 400,
    code: 'ITEM_NOT_FOUND',
    reason: 'Recipe 99 not found'
});
```

- [ ] **Step 2: Compile and verify the test currently fails**

```bash
cd back && npx tsc && npm run tests -- -f 'cookbook/getRecipe'
```

Expected: the `Should return an error when calling with an unknown id` test fails with a code mismatch.

- [ ] **Step 3: Remove `RECIPE_ID_NOT_FOUND` from `codes.ts`**

In `back/src/libs/errors/codes.ts`, remove the `RECIPE_ID_NOT_FOUND` line:

```typescript
// before:
    // Cookbook
    'DUPLICATE_INGREDIENT',
    'RECIPE_ID_NOT_FOUND',

// after:
    // Cookbook
    'DUPLICATE_INGREDIENT',
```

- [ ] **Step 4: Update `RecipeNotFoundError` to use `ITEM_NOT_FOUND`**

In `back/src/libs/modules/cookbook/errors.ts`, change the code:

```typescript
export class RecipeNotFoundError extends AppError {
    constructor(id: number) {
        super({ code: 'ITEM_NOT_FOUND', httpStatus: 400, reason: `Recipe ${id} not found` });
    }
}
```

- [ ] **Step 5: Update `getRecipe.ts` route's `clientErrors`**

In `back/src/libs/routes/cookbook/getRecipe.ts`, change:

```typescript
// before:
    clientErrors: ['RECIPE_ID_NOT_FOUND']
// after:
    clientErrors: ['ITEM_NOT_FOUND']
```

- [ ] **Step 6: Compile and verify the test passes**

```bash
cd back && npx tsc && npm run tests -- -f 'cookbook/getRecipe'
```

Expected: all getRecipe tests pass.

- [ ] **Step 7: Run the full framework suite**

```bash
cd back && npm run tests:framework
```

Expected: 41 passing.

- [ ] **Step 8: Check formatting**

```bash
cd back && npm run check
```

- [ ] **Step 9: Commit**

```bash
cd back && git add \
  src/libs/errors/codes.ts \
  src/libs/modules/cookbook/errors.ts \
  src/libs/routes/cookbook/getRecipe.ts \
  tests/routes/cookbook/getRecipe/getRecipe.test.ts && \
git commit -m "refactor(errors): merge RECIPE_ID_NOT_FOUND into ITEM_NOT_FOUND"
```

---

## Task 3: Rename `SENSOR_NAME_DOES_NOT_EXISTS` → `SENSOR_NOT_FOUND`

The old code has a grammatical error and exposes an internal DB column name (`sensorName`) in the code string. Replace with a clean domain-specific code. Rename the class to match.

**Files:**
- Modify: `back/src/libs/errors/codes.ts`
- Modify: `back/src/libs/modules/homeTracker/errors.ts`
- Modify: `back/src/libs/modules/homeTracker/services/sensorMetaData.ts`
- Modify: `back/src/libs/routes/homeTracker/updateSensorMetadata.ts`
- Test: `back/tests/routes/homeTracker/updateSensorMetadata/updateSensorMetadata.test.ts`

- [ ] **Step 1: Update the test assertion**

In `back/tests/routes/homeTracker/updateSensorMetadata/updateSensorMetadata.test.ts`, change line 79:

```typescript
// before:
assert.deepEqual(res.body, { httpStatus: 400, code: 'SENSOR_NAME_DOES_NOT_EXISTS' });

// after:
assert.deepEqual(res.body, { httpStatus: 400, code: 'SENSOR_NOT_FOUND' });
```

- [ ] **Step 2: Compile and verify the test currently fails**

```bash
cd back && npx tsc && npm run tests -- -f 'updateSensorMetadata'
```

Expected: the `Should fail for a non-existing sensor` test fails with a code mismatch.

- [ ] **Step 3: Update `codes.ts`**

In `back/src/libs/errors/codes.ts`, replace the old code with the new one:

```typescript
// before:
    // HomeTracker
    'SENSOR_NAME_DOES_NOT_EXISTS',

// after:
    // HomeTracker
    'SENSOR_NOT_FOUND',
```

- [ ] **Step 4: Update `homeTracker/errors.ts`**

In `back/src/libs/modules/homeTracker/errors.ts`, rename the class and update the code:

```typescript
import { AppError } from '../../errors/AppError.js';

export class SensorNotFoundError extends AppError {
    constructor() {
        super({ code: 'SENSOR_NOT_FOUND', httpStatus: 400 });
    }
}
```

- [ ] **Step 5: Update the import and usage in `sensorMetaData.ts`**

In `back/src/libs/modules/homeTracker/services/sensorMetaData.ts`, update the import and the throw site. The import is on line 4 and the throw is wherever `SensorDoesNotExistError` is instantiated:

```typescript
// before (line 4):
import { SensorDoesNotExistError } from '../errors.js';

// after:
import { SensorNotFoundError } from '../errors.js';
```

Find the throw site (search for `new SensorDoesNotExistError`) and change it:

```typescript
// before:
        throw new SensorDoesNotExistError();
// after:
        throw new SensorNotFoundError();
```

- [ ] **Step 6: Update `updateSensorMetadata.ts` route's `clientErrors`**

In `back/src/libs/routes/homeTracker/updateSensorMetadata.ts`, change:

```typescript
// before:
    clientErrors: ['SENSOR_NAME_DOES_NOT_EXISTS'],
// after:
    clientErrors: ['SENSOR_NOT_FOUND'],
```

- [ ] **Step 7: Compile and verify the test passes**

```bash
cd back && npx tsc && npm run tests -- -f 'updateSensorMetadata'
```

Expected: both updateSensorMetadata tests pass.

- [ ] **Step 8: Run the full framework suite**

```bash
cd back && npm run tests:framework
```

Expected: 41 passing.

- [ ] **Step 9: Check formatting**

```bash
cd back && npm run check
```

- [ ] **Step 10: Commit**

```bash
cd back && git add \
  src/libs/errors/codes.ts \
  src/libs/modules/homeTracker/errors.ts \
  src/libs/modules/homeTracker/services/sensorMetaData.ts \
  src/libs/routes/homeTracker/updateSensorMetadata.ts \
  tests/routes/homeTracker/updateSensorMetadata/updateSensorMetadata.test.ts && \
git commit -m "refactor(errors): rename SENSOR_NAME_DOES_NOT_EXISTS to SENSOR_NOT_FOUND"
```

---

## Task 4: Create `modules/s3files/errors.ts` and `modules/clipboard/errors.ts`, delete `routes/errors.ts`

`routes/errors.ts` sits at the route layer but is imported by lower-level modules (`s3files`, `reactor`). This task moves all its live classes to the correct module `errors.ts` files and deletes the source file. `ItemAlreadyExistsError` is already dead (no callers) and is simply removed.

**Files:**
- Create: `back/src/libs/modules/s3files/errors.ts`
- Create: `back/src/libs/modules/clipboard/errors.ts`
- Delete: `back/src/libs/routes/errors.ts`
- Modify: `back/src/libs/modules/s3files/index.ts`
- Modify: `back/src/libs/modules/reactor/getEntries.ts`
- Modify: `back/src/libs/routes/clipboard/addEntry.ts`

There are no test assertions to update here — the error codes on the wire are unchanged. The only verification is that the code compiles and the framework test suite still passes.

- [ ] **Step 1: Create `back/src/libs/modules/s3files/errors.ts`**

`ItemNotFoundError`, `TooManyEntriesError`, and `ExpiredItemError` are thrown by `s3files/index.ts` and also imported by `reactor/getEntries.ts` (which already depends on `s3files`). Centralise them here:

```typescript
import { AppError } from '../../errors/AppError.js';

export class ItemNotFoundError extends AppError {
    constructor() {
        super({ code: 'ITEM_NOT_FOUND', httpStatus: 400 });
    }
}

export class TooManyEntriesError extends AppError {
    constructor() {
        super({ code: 'TOO_MANY_ENTRIES', httpStatus: 400 });
    }
}

export class ExpiredItemError extends AppError {
    constructor() {
        super({ code: 'ITEM_IS_EXPIRED', httpStatus: 400 });
    }
}
```

- [ ] **Step 2: Create `back/src/libs/modules/clipboard/errors.ts`**

`FileOrContentRequiredError` is only thrown in the clipboard route handler:

```typescript
import { AppError } from '../../errors/AppError.js';

export class FileOrContentRequiredError extends AppError {
    constructor() {
        super({ code: 'FILE_OR_CONTENT_REQUIRED', httpStatus: 400 });
    }
}
```

- [ ] **Step 3: Update `s3files/index.ts` to import from `./errors.js`**

In `back/src/libs/modules/s3files/index.ts`, change the import on line 7:

```typescript
// before:
import { ExpiredItemError, ItemNotFoundError, TooManyEntriesError } from '../../routes/errors.js';

// after:
import { ExpiredItemError, ItemNotFoundError, TooManyEntriesError } from './errors.js';
```

No other changes to this file.

- [ ] **Step 4: Update `reactor/getEntries.ts` to import from `s3files/errors.js`**

In `back/src/libs/modules/reactor/getEntries.ts`, change line 5:

```typescript
// before:
import { ItemNotFoundError, TooManyEntriesError } from '../../routes/errors.js';

// after:
import { ItemNotFoundError, TooManyEntriesError } from '../s3files/errors.js';
```

- [ ] **Step 5: Update `routes/clipboard/addEntry.ts` to import from the module**

In `back/src/libs/routes/clipboard/addEntry.ts`, change line 5:

```typescript
// before:
import { FileOrContentRequiredError } from '../errors.js';

// after:
import { FileOrContentRequiredError } from '../../modules/clipboard/errors.js';
```

- [ ] **Step 6: Delete `back/src/libs/routes/errors.ts`**

```bash
rm back/src/libs/routes/errors.ts
```

- [ ] **Step 7: Compile and check for errors**

```bash
cd back && npx tsc
```

Expected: zero errors. If there are import errors, a file still references `routes/errors.ts` — search with:

```bash
grep -rn "routes/errors" back/src --include="*.ts"
```

Fix any remaining imports.

- [ ] **Step 8: Run the full framework suite**

```bash
cd back && npm run tests:framework
```

Expected: 41 passing.

- [ ] **Step 9: Check formatting**

```bash
cd back && npm run check
```

- [ ] **Step 10: Commit**

```bash
cd back && git add \
  src/libs/modules/s3files/errors.ts \
  src/libs/modules/s3files/index.ts \
  src/libs/modules/clipboard/errors.ts \
  src/libs/routes/clipboard/addEntry.ts \
  src/libs/modules/reactor/getEntries.ts && \
git rm src/libs/routes/errors.ts && \
git commit -m "refactor(errors): move route errors into module errors.ts files, delete routes/errors.ts"
```
