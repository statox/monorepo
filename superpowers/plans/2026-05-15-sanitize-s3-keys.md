# Sanitize S3 Keys with Slug Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent path traversal and URL confusion in S3 keys by slugifying filenames before embedding them in keys, and centralise key construction in a dedicated `createS3Key` helper.

**Architecture:** Add `createS3Key` to `s3files/index.ts` (the natural home for S3-related utilities); it generates the `linkId` and the sanitised key in one place so callers never build keys manually. Both `clipboard/addEntry.ts` and `reactor/addEntry.ts` are updated to call it. Existing route tests are updated to assert against slugified names.

**Tech Stack:** TypeScript, `slug` npm package (just installed), Mocha/Chai for tests.

---

## Slug behaviour reference

These are verified outputs of `slug()` that inform test assertions:

| Input | `slug()` output |
|---|---|
| `'entry name'` | `'entry-name'` |
| `'should_fail'` | `'shouldfail'` |
| `'animated_image'` | `'animatedimage'` |
| `'A cool entry'` | `'a-cool-entry'` |
| `'image'` | `'image'` |
| `'foo/bar'` | `'foobar'` |

---

## File map

| Action | Path |
|---|---|
| Modify | `back/src/libs/modules/s3files/index.ts` |
| Modify | `back/src/libs/modules/clipboard/addEntry.ts` |
| Modify | `back/src/libs/modules/reactor/addEntry.ts` |
| Create | `back/tests/framework/s3files.test.ts` |
| Modify | `back/tests/helpers/s3/index.ts` |
| Modify | `back/tests/routes/clipboard/addEntry.test.ts` |
| Modify | `back/tests/routes/reactor/addEntry.test.ts` |

---

### Task 1: Write failing unit tests for `createS3Key`

**Files:**
- Create: `back/tests/framework/s3files.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
// back/tests/framework/s3files.test.ts
import { assert } from 'chai';
import { createS3Key } from '../../src/libs/modules/s3files/index.js';

describe('s3files/createS3Key', () => {
    it('returns a linkId and an s3Key', () => {
        const { linkId, s3Key } = createS3Key({ filename: 'hello world' });
        assert.isString(linkId);
        assert.isString(s3Key);
    });

    it('slugifies spaces in the filename', () => {
        const { s3Key } = createS3Key({ filename: 'entry name' });
        assert.match(s3Key, /^[0-9a-f]{8}_entry-name$/);
    });

    it('slugifies path separators', () => {
        const { s3Key } = createS3Key({ filename: 'foo/bar' });
        assert.match(s3Key, /^[0-9a-f]{8}_foobar$/);
    });

    it('slugifies underscores', () => {
        const { s3Key } = createS3Key({ filename: 'with_underscore' });
        assert.match(s3Key, /^[0-9a-f]{8}_with_underscore$/);
    });

    it('appends extension when provided', () => {
        const { s3Key } = createS3Key({ filename: 'image', extension: 'png' });
        assert.match(s3Key, /^[0-9a-f]{8}_image\.png$/);
    });

    it('omits extension when not provided', () => {
        const { s3Key } = createS3Key({ filename: 'image' });
        assert.notMatch(s3Key, /\./);
    });

    it('generates unique linkId on each call', () => {
        const a = createS3Key({ filename: 'test' });
        const b = createS3Key({ filename: 'test' });
        assert.notEqual(a.linkId, b.linkId);
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd back && npm run tests:framework -- -f 's3files/createS3Key'
```

Expected: compile error or runtime error — `createS3Key` is not exported yet.

---

### Task 2: Implement `createS3Key` in `s3files/index.ts`

**Files:**
- Modify: `back/src/libs/modules/s3files/index.ts`

- [ ] **Step 1: Add imports at the top of the file**

In `back/src/libs/modules/s3files/index.ts`, add two imports after the existing ones:

```typescript
import slug from 'slug';
import { generate4BytesHex } from '../random.js';
```

The full import block at the top of the file becomes:

```typescript
import { File } from 'formidable';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { getPresignedUrl, S3 } from '../../databases/s3.js';
import { db } from '../../databases/db.js';
import { ExpiredItemError, ItemNotFoundError, TooManyEntriesError } from './errors.js';
import { slog } from '../logging/index.js';
import slug from 'slug';
import { generate4BytesHex } from '../random.js';
```

- [ ] **Step 2: Add the `createS3Key` function export after the imports and before `createS3FileInTransaction`**

```typescript
export const createS3Key = (params: { filename: string; extension?: string }): { linkId: string; s3Key: string } => {
    const { filename, extension } = params;
    const linkId = generate4BytesHex();
    const cleanName = slug(filename);

    let s3Key = `${linkId}_${cleanName}`;
    if (extension) {
        s3Key += `.${extension}`;
    }

    return { linkId, s3Key };
};
```

- [ ] **Step 3: Run unit tests to verify they pass**

```bash
cd back && npm run tests:framework -- -f 's3files/createS3Key'
```

Expected: all 7 tests pass.

- [ ] **Step 4: Commit**

```bash
git add back/src/libs/modules/s3files/index.ts back/tests/framework/s3files.test.ts
git commit -m "feat: add createS3Key helper that slugifies filenames"
```

---

### Task 3: Update `clipboard/addEntry.ts`

**Files:**
- Modify: `back/src/libs/modules/clipboard/addEntry.ts`

Clipboard entries may or may not have a file. When there is no file, `linkId` still needs to be generated (it is stored in the DB), but no `s3Key` is built. When there is a file, `createS3Key` provides both.

- [ ] **Step 1: Replace the file with the updated version**

```typescript
// back/src/libs/modules/clipboard/addEntry.ts
import { File } from 'formidable';
import mime from 'mime-types';
import { generate4BytesHex } from '../random.js';
import { db } from '../../databases/db.js';
import { createS3FileInTransaction, createS3Key } from '../s3files/index.js';
import { handleDuplicateEntry } from '../../errors/dbHelpers.js';

type NewEntryParams = {
    name: string;
    content?: string;
    ttlSeconds?: number;
    isPublic?: boolean;
    file?: File;
};

export const addEntry = async (newEntry: NewEntryParams) => {
    const DEFAULT_TTL = 60 * 5; // 5 MINUTES
    const { name, content, ttlSeconds = DEFAULT_TTL, isPublic = false, file } = newEntry;

    let linkId: string;
    let s3Key: string | undefined;

    if (file) {
        const mimeExtension = mime.extension(file.mimetype ?? '') || undefined;
        ({ linkId, s3Key } = createS3Key({ filename: name, extension: mimeExtension }));
    } else {
        linkId = generate4BytesHex();
        s3Key = undefined;
    }

    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
        await conn.query(
            `
INSERT INTO Clipboard (name, content, ttl, isPublic, linkId, s3Key, creationDateUnix)
VALUES (?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP())
`,
            [name, content, ttlSeconds, isPublic, linkId, s3Key]
        );

        if (file && s3Key) {
            await createS3FileInTransaction(conn, { file, bucket: 'clipboard', s3Key });
        }

        return conn.commit();
    } catch (error) {
        await conn.rollback();
        handleDuplicateEntry(error, 'ITEM_ALREADY_EXISTS');
    } finally {
        conn.release();
    }
};
```

---

### Task 4: Update `reactor/addEntry.ts`

**Files:**
- Modify: `back/src/libs/modules/reactor/addEntry.ts`

Reactor entries always have a file, so `createS3Key` cleanly replaces both the `generate4BytesHex` call and the manual `s3Key` construction. The `generate4BytesHex` import can be removed entirely.

- [ ] **Step 1: Replace the file with the updated version**

```typescript
// back/src/libs/modules/reactor/addEntry.ts
import { File } from 'formidable';
import mime from 'mime-types';
import { db } from '../../databases/db.js';
import { handleDuplicateEntry } from '../../errors/dbHelpers.js';
import { createS3FileInTransaction, createS3Key } from '../s3files/index.js';

type NewEntryParams = {
    name: string;
    tags: string[];
    file: File;
};

export const addEntry = async (newEntry: NewEntryParams) => {
    const { name, tags, file } = newEntry;

    const mimeExtension = mime.extension(file.mimetype ?? '') || undefined;
    const { linkId, s3Key } = createS3Key({ filename: name, extension: mimeExtension });

    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
        await conn.query(
            `INSERT INTO Reactor (name, tags, linkId, s3Key, creationDateUnix) VALUES (?, ?, ?, ?, UNIX_TIMESTAMP())`,
            [name, JSON.stringify(tags), linkId, s3Key]
        );

        await createS3FileInTransaction(conn, { file, bucket: 'reactor', s3Key });
        return conn.commit();
    } catch (error) {
        await conn.rollback();
        handleDuplicateEntry(error, 'ITEM_ALREADY_EXISTS');
    } finally {
        conn.release();
    }
};
```

- [ ] **Step 2: Commit**

```bash
git add back/src/libs/modules/clipboard/addEntry.ts back/src/libs/modules/reactor/addEntry.ts
git commit -m "refactor: use createS3Key in clipboard and reactor addEntry"
```

---

### Task 5: Update S3 mock and route tests for slugified keys

**Files:**
- Modify: `back/tests/helpers/s3/index.ts`
- Modify: `back/tests/routes/clipboard/addEntry.test.ts`
- Modify: `back/tests/routes/reactor/addEntry.test.ts`

The S3 mock triggers failures when the key contains `should_fail`. After slugification, `slug('should_fail')` → `'shouldfail'`, so the mock condition and the test names must change together.

Similarly, key matchers in route tests must reflect slugified output:
- `'entry name'` → `'entry-name'`
- `'animated_image'` → `'animatedimage'`

- [ ] **Step 1: Update the S3 mock condition**

In `back/tests/helpers/s3/index.ts`, change the `.on()` condition from `should_fail` to `shouldfail`:

```typescript
// Change this line:
return params.Key?.includes('should_fail');
// To:
return params.Key?.includes('shouldfail');
```

- [ ] **Step 2: Update clipboard route tests**

In `back/tests/routes/clipboard/addEntry.test.ts`:

2a. The failing-S3 test sends `name: 'should_fail'`. Change it to `name: 'should-fail'` so that `slug('should-fail')` → `'should-fail'` which still contains `shouldfail`... actually `slug('should-fail')` → `'should-fail'`, which does NOT contain `shouldfail`. Use `name: 'shouldfail'` directly instead so the slugified key is `{linkId}_shouldfail`.

```typescript
// In the 'Failing S3 command should not commit changes in the DB' test:
// Change:
.field('name', 'should_fail')
// To:
.field('name', 'shouldfail')
```

2b. Update the `entry name` s3Key matchers (two tests):

```typescript
// Change:
s3Key: (value: string) => value.match(/.*entry name/) !== null
// To:
s3Key: (value: string) => value.match(/.*entry-name/) !== null
```

Apply this change in all four occurrences in the file (Clipboard and S3Files checks in both file-entry tests).

2c. Update the `animated_image` matcher:

```typescript
// Change:
s3Key: (value: string) => value.match(/.*animated_image.gif/) !== null
// To:
s3Key: (value: string) => value.match(/.*animatedimage.gif/) !== null
```

Apply in both Clipboard and S3Files checks.

- [ ] **Step 3: Update reactor route tests**

In `back/tests/routes/reactor/addEntry.test.ts`:

3a. Change the failing-S3 test name:

```typescript
// Change:
.field('name', 'should_fail')
// To:
.field('name', 'shouldfail')
```

3b. Update the `entry name` s3Key matchers (appears in two `it` blocks, each with Reactor and S3Files checks — four occurrences total):

```typescript
// Change:
s3Key: (value: string) => value.match(/.*entry name/) !== null
// To:
s3Key: (value: string) => value.match(/.*entry-name/) !== null
```

- [ ] **Step 4: Run all route tests to verify everything passes**

```bash
cd back && npm run tests -- -f 'clipboard/addEntry'
```

Expected: all tests pass.

```bash
cd back && npm run tests -- -f 'reactor/addEntry'
```

Expected: all tests pass.

- [ ] **Step 5: Run the full test suite**

```bash
cd back && npm run tests:all
```

Expected: all suites pass.

- [ ] **Step 6: Run lint**

```bash
cd back && npm run check
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add back/tests/helpers/s3/index.ts back/tests/routes/clipboard/addEntry.test.ts back/tests/routes/reactor/addEntry.test.ts
git commit -m "test: update S3 mock and route tests for slugified keys"
```
