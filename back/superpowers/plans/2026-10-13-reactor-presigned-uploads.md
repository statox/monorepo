# Reactor presigned uploads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reactor files go from the browser straight to R2 through a presigned PUT URL, with `S3Files` tracking a pending → uploaded state and a periodic task reaping abandoned uploads.

**Architecture:** `POST /reactor/prepareUpload` inserts the `Reactor` row and a pending `S3Files` row (`uploadedDateUnix = NULL`) and returns a URL signed for the exact content type and size. The browser PUTs to R2, then `POST /reactor/confirmUpload` checks the object with `HeadObject` and sets `uploadedDateUnix`. `getPresignedURLForKey` stays the single read-gate and rejects pending rows. A 60 min periodic task deletes pending uploads older than 1 h.

**Tech Stack:** TypeScript, Express 5, mysql2, `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, Mocha/Chai/Supertest + `aws-sdk-client-mock`, SvelteKit front, generated SDK in `packages/sdk`.

**Spec:** [`back/superpowers/specs/2026-10-13-reactor-presigned-uploads-design.md`](../specs/2026-10-13-reactor-presigned-uploads-design.md)

## Global Constraints

- Allowed mime types: `image/png`, `image/jpeg`, `image/gif`, `image/webp`.
- Size: `sizeBytes` integer, minimum 1, maximum 10485760 (10 MB).
- Presigned PUT expiry: 900 s. Signed with `signableHeaders: new Set(['content-type'])`.
- `S3Client` has `requestChecksumCalculation: 'WHEN_REQUIRED'`.
- Abandoned upload threshold: `S3Files.creationDateUnix` older than 3600 s. Periodic task interval: 60 min, no Slack on failure.
- New error code `UPLOAD_NOT_FOUND` (http 400). `FILE_REQUIRED` is removed.
- Clipboard keeps its multipart route and `createS3FileInTransaction`; only its insert sets the new column.
- All npm commands run in `back/` or `front/`, never the repo root.
- Tests run against compiled JS in `dist/`: always `npm run build` before `npm run tests`. `npm run tests` needs the local docker env (`npm run env`) up - the user runs it. If MySQL is not reachable, stop and ask the user.
- ES modules: every relative import ends in `.js`.
- `slog.log` components and properties must exist in `src/libs/modules/logging/types.ts` (`reactor`, `s3Files`, `entryName`, `s3Key`, `bucket`, `linkId`, `error` all exist).
- Any route change requires `npm run generate:sdk` (in `back/`).
- Commit messages follow the repo style `Area - Description` and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A signed URL leaking an empty-body CRC32 checksum** - prod uploads would 403 on R2 while every local test passes. Pinned by the `prepareUpload` test asserting no `x-amz-checksum-crc32` / `x-amz-sdk-checksum-algorithm` in the URL (Task 2).
2. **Content type not signed** - a client could upload `text/html` with an image URL. Pinned by asserting `X-Amz-SignedHeaders=content-length;content-type;host` (Task 2).
3. **Pending entries visible to readers** - a half-uploaded entry showing as a broken image on the public page or via `/r/:linkId`. Pinned in Task 1 (`getEntry` pending → `ITEM_NOT_FOUND`) and Task 4 (`getEntriesForPublic` excludes pending).
4. **Confirm on an object that was never uploaded** - must leave the row pending, not mark it uploaded. Pinned in Task 3 (`HeadObject` 404 test checks `uploadedDateUnix` stays `null`).
5. **Reaper deleting confirmed or fresh entries, or losing rows when S3 delete fails** - pinned in Task 5 (fresh pending kept, confirmed kept, `shouldfail` keeps both rows).

---

## File map

| File | Change |
|---|---|
| `back/src/tools/tables/S3Files.sql` | add `uploadedDateUnix` |
| `back/src/libs/databases/s3.ts` | checksum setting, `getPresignedPutUrl`, local CORS in `initS3` |
| `back/src/libs/modules/s3files/index.ts` | read-gate on `uploadedDateUnix`, Clipboard insert, `prepareS3FileInTransaction`, `confirmS3FileUpload`, `deleteAbandonedS3FileInTransaction` |
| `back/src/libs/modules/s3files/errors.ts` | `UploadNotFoundError` |
| `back/src/libs/errors/codes.ts` | `+UPLOAD_NOT_FOUND`, `-FILE_REQUIRED` |
| `back/src/libs/modules/reactor/constants.ts` | create: mime list, max size, abandon age |
| `back/src/libs/modules/reactor/prepareEntryUpload.ts` | create |
| `back/src/libs/modules/reactor/confirmEntryUpload.ts` | create |
| `back/src/libs/modules/reactor/reapAbandonedUploads.ts` | create |
| `back/src/libs/modules/reactor/getEntries.ts` | JOIN on uploaded files |
| `back/src/libs/modules/reactor/index.ts` | exports |
| `back/src/libs/modules/reactor/addEntry.ts`, `errors.ts` | delete |
| `back/src/libs/routes/reactor/prepareUpload.ts`, `confirmUpload.ts` | create |
| `back/src/libs/routes/reactor/addEntry.ts` | delete |
| `back/src/libs/routes/index.ts` | register routes |
| `back/src/libs/PeriodicTasks/index.ts` | register reaper |
| `back/tests/helpers/s3/index.ts` | `HeadObject` / `DeleteObject` mocks, `checkCall` union |
| `back/tests/routes/reactor/*.test.ts` | new + updated tests, delete `addEntry.test.ts` |
| `back/tests/routes/clipboard/*.test.ts` | fixtures/assertions get `uploadedDateUnix` |
| `back/tests/periodicTasks/reactor/reactor.test.ts` | create |
| `packages/sdk/src/generated/*` | regenerated |
| `front/src/lib/Reactor/api.ts`, `front/src/routes/(apps)/reactor/components/ReactorForm.svelte` | three-step upload |
| `back/REPO_OVERVIEW.md` | Reactor endpoint list |

---

### Task 1: `uploadedDateUnix` column and read-gate

**Files:**
- Modify: `back/src/tools/tables/S3Files.sql`
- Modify: `back/src/libs/modules/s3files/index.ts` (`createS3FileInTransaction`, `getPresignedURLForKey`)
- Test: `back/tests/routes/reactor/getEntry.test.ts`, `back/tests/routes/reactor/getEntriesForPublic.test.ts`, `back/tests/routes/clipboard/{getPublicEntries,getAllEntries,staticView,deleteEntry,addEntry}.test.ts`

**Interfaces:**
- Produces: column `S3Files.uploadedDateUnix int(11) unsigned DEFAULT NULL`. `NULL` = pending. `getPresignedURLForKey` throws `ItemNotFoundError` for pending rows.

- [ ] **Step 1: Write the failing test**

Add to `back/tests/routes/reactor/getEntry.test.ts`, inside the `describe`:

```ts
    it('should return an error for a linkId whose S3File is still pending upload', async () => {
        await th.mysql.fixture({
            Reactor: [
                {
                    id: 1,
                    name: 'entry 1',
                    tags: '["tag1","tag2"]',
                    creationDateUnix: 10,
                    linkId: 'aaaaaaaa',
                    s3Key: 'foo'
                }
            ],
            S3Files: [
                {
                    bucket: 'reactor',
                    s3Key: 'foo',
                    creationDateUnix: 10,
                    uploadedDateUnix: null
                }
            ]
        });

        await request(app)
            .get('/r/aaaaaaaa')
            .set('Accept', 'application/json')
            .expect(400)
            .then((response) => {
                assert.deepEqual(response.body, { httpStatus: 400, code: 'ITEM_NOT_FOUND' });
            });
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run (in `back/`): `npm run build && npm run tests -- -f 'r/:linkId'`
Expected: the new test FAILS (fixture insert errors with `Unknown column 'uploadedDateUnix'`).

- [ ] **Step 3: Add the column**

In `back/src/tools/tables/S3Files.sql`, after the `deletionDateUnix` line:

```sql
    `deletionDateUnix` int(11) DEFAULT NULL,
    `uploadedDateUnix` int(11) unsigned DEFAULT NULL,
```

- [ ] **Step 4: Gate reads and set the column for Clipboard**

In `back/src/libs/modules/s3files/index.ts`:

`createS3FileInTransaction` insert becomes:

```ts
        await conn.query(
            `INSERT INTO S3Files (bucket, s3Key, creationDateUnix, uploadedDateUnix) VALUES (?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())`,
            [bucket, s3Key]
        );
```

`getPresignedURLForKey` and its row type become:

```ts
interface s3FileResult extends RowDataPacket {
    s3Key: string;
    deletionDateUnix?: number;
    uploadedDateUnix: number | null;
}
export const getPresignedURLForKey = async (params: { bucket: ManagedBuckets; s3Key: string }) => {
    const { bucket, s3Key } = params;
    const [rows] = await db.query<s3FileResult[]>(
        'SELECT s3Key, deletionDateUnix, uploadedDateUnix FROM S3Files WHERE s3Key = ? AND bucket = ?',
        [s3Key, bucket]
    );

    if (!rows.length) {
        throw new ItemNotFoundError();
    }
    if (rows.length > 1) {
        slog.log('s3Files', 'multiple entries with same s3Key', { s3Key, bucket });
        throw new TooManyEntriesError();
    }
    if (rows[0].deletionDateUnix) {
        throw new ExpiredItemError();
    }
    // Pending: prepared but never confirmed as present in the bucket
    if (rows[0].uploadedDateUnix === null) {
        throw new ItemNotFoundError();
    }

    return getPresignedUrl({ bucket, key: s3Key });
};
```

- [ ] **Step 5: Update existing fixtures that expect a live file**

Every `S3Files` fixture row in these files gets `uploadedDateUnix` set to the same value as its `creationDateUnix`. Example (from `getEntry.test.ts`):

```ts
            S3Files: [
                {
                    bucket: 'reactor',
                    s3Key: 'foo',
                    creationDateUnix: 10,
                    uploadedDateUnix: 10
                }
            ]
```

Locations:
- `tests/routes/reactor/getEntry.test.ts`: the "should redirect to the s3 presigned url" fixture.
- `tests/routes/reactor/getEntriesForPublic.test.ts`: both rows of the first test (`foo` → 10, `bar` → 50), the `foo` row of the second test (→ 10).
- `tests/routes/clipboard/getPublicEntries.test.ts:52`, `getAllEntries.test.ts:46` and `:127`, `staticView.test.ts:73`, `deleteEntry.test.ts:69`: every row, `uploadedDateUnix: <same expression as creationDateUnix>` (e.g. `th.mysql.nowSec()`).

- [ ] **Step 6: Assert Clipboard sets the column**

In `tests/routes/clipboard/addEntry.test.ts`, every `S3Files` object inside a `th.mysql.checkContains` call (around lines 249, 291, 327, 361) gets:

```ts
                        uploadedDateUnix: th.mysql.aroundNowSec
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm run build && npm run tests -- -f 'r/:linkId'` then `npm run tests -- -f 'reactor'` then `npm run tests -- -f 'clipboard'`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add back/src/tools/tables/S3Files.sql back/src/libs/modules/s3files/index.ts back/tests/routes/reactor back/tests/routes/clipboard
git commit -m "S3Files - Add uploadedDateUnix and reject pending files on read

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `POST /reactor/prepareUpload`

**Files:**
- Modify: `back/src/libs/databases/s3.ts`
- Modify: `back/src/libs/modules/s3files/index.ts`
- Create: `back/src/libs/modules/reactor/constants.ts`, `back/src/libs/modules/reactor/prepareEntryUpload.ts`
- Modify: `back/src/libs/modules/reactor/index.ts`
- Create: `back/src/libs/routes/reactor/prepareUpload.ts`
- Modify: `back/src/libs/routes/index.ts`
- Test: `back/tests/routes/reactor/prepareUpload.test.ts`

**Interfaces:**
- Consumes: `S3Files.uploadedDateUnix` (Task 1).
- Produces:
    - `getPresignedPutUrl(params: { bucket: string; key: string; contentType: string; contentLength: number }): Promise<string>` in `databases/s3.ts`
    - `prepareS3FileInTransaction(conn: PoolConnection, params: { bucket: ManagedBuckets; s3Key: string; contentType: string; sizeBytes: number }): Promise<string>` in `s3files`
    - `REACTOR_ALLOWED_MIMES`, `ReactorMime`, `REACTOR_MAX_SIZE_BYTES`, `ABANDONED_UPLOAD_AGE_SEC` in `reactor/constants.ts`
    - `prepareEntryUpload(params: { name: string; tags: string[]; mimetype: ReactorMime; sizeBytes: number }): Promise<{ linkId: string; uploadUrl: string }>`
    - route `POST /reactor/prepareUpload`, input `{ name, tags, mimetype, sizeBytes }`, output `{ linkId, uploadUrl }`

- [ ] **Step 1: Write the failing tests**

Create `back/tests/routes/reactor/prepareUpload.test.ts`:

```ts
import request from 'supertest';
import { app } from '../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../helpers/index.js';

const validInput = {
    name: 'entry name',
    tags: ['tag1', 'tag2'],
    mimetype: 'image/png',
    sizeBytes: 1234
};

describe('reactor/prepareUpload', () => {
    describe('should fail', () => {
        it('when unauthenticated', async () => {
            await request(app).post('/reactor/prepareUpload').send(validInput).expect(401);
            await th.mysql.checkTableLength('Reactor', 0);
        });

        it('on duplicate name', async () => {
            await th.mysql.fixture({
                Reactor: [
                    {
                        id: 1,
                        name: 'entry name',
                        tags: '[]',
                        creationDateUnix: 10,
                        linkId: 'aabbccdd',
                        s3Key: 'aabbccdd_entry-name.png'
                    }
                ]
            });

            await request(app)
                .post('/reactor/prepareUpload')
                .set('Cookie', th.auth2.getPassportSessionCookie())
                .send(validInput)
                .expect(400)
                .then((response) => {
                    assert.deepEqual(response.body, {
                        httpStatus: 400,
                        code: 'ITEM_ALREADY_EXISTS'
                    });
                });

            await th.mysql.checkTableLength('Reactor', 1);
            await th.mysql.checkTableLength('S3Files', 0);
        });

        const invalidInputs: [string, Record<string, unknown>][] = [
            ['non image mimetype', { ...validInput, mimetype: 'text/html' }],
            ['image mimetype not in the allow list', { ...validInput, mimetype: 'image/svg+xml' }],
            ['file larger than 10 MB', { ...validInput, sizeBytes: 10 * 1024 * 1024 + 1 }],
            ['empty file', { ...validInput, sizeBytes: 0 }],
            ['non integer size', { ...validInput, sizeBytes: 12.5 }],
            ['empty name', { ...validInput, name: '' }]
        ];
        for (const [label, input] of invalidInputs) {
            it(`on ${label}`, async () => {
                await request(app)
                    .post('/reactor/prepareUpload')
                    .set('Cookie', th.auth2.getPassportSessionCookie())
                    .send(input)
                    .expect(400)
                    .then((response) => {
                        assert.equal(response.body.code, 'INPUT_VALIDATION_FAILED');
                    });

                await th.mysql.checkTableLength('Reactor', 0);
                await th.mysql.checkTableLength('S3Files', 0);
            });
        }
    });

    it('should create pending rows and return a URL signed for content type and size', async () => {
        let linkId = '';
        let uploadUrl = '';
        await request(app)
            .post('/reactor/prepareUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send(validInput)
            .expect(200)
            .then((response) => {
                ({ linkId, uploadUrl } = response.body);
            });

        assert.match(linkId, /^[0-9a-f]{8}$/);
        const expectedS3Key = `${linkId}_entry-name.png`;

        const url = new URL(uploadUrl);
        assert.equal(url.pathname, `/reactor/${expectedS3Key}`);
        assert.equal(
            url.searchParams.get('X-Amz-SignedHeaders'),
            'content-length;content-type;host'
        );
        assert.equal(url.searchParams.get('X-Amz-Expires'), '900');
        // R2 validates checksums in presigned URLs: an empty-body CRC32 must never be signed
        assert.isNull(url.searchParams.get('x-amz-checksum-crc32'));
        assert.isNull(url.searchParams.get('x-amz-sdk-checksum-algorithm'));

        // Signing is local: nothing is sent to S3
        th.s3.checkNbCalls({ nbCalls: 0 });

        await th.mysql.checkContains({
            Reactor: [
                {
                    name: 'entry name',
                    linkId,
                    s3Key: expectedS3Key,
                    tags: '["tag1","tag2"]',
                    creationDateUnix: th.mysql.aroundNowSec
                }
            ],
            S3Files: [
                {
                    bucket: 'reactor',
                    s3Key: expectedS3Key,
                    creationDateUnix: th.mysql.aroundNowSec,
                    uploadedDateUnix: null,
                    deletionDateUnix: null
                }
            ]
        });
    });

    it('should use the extension matching the mimetype', async () => {
        await request(app)
            .post('/reactor/prepareUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send({ ...validInput, mimetype: 'image/jpeg' })
            .expect(200)
            .then((response) => {
                assert.match(new URL(response.body.uploadUrl).pathname, /_entry-name\.jpeg$/);
            });
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run build && npm run tests -- -f 'reactor/prepareUpload'`
Expected: FAIL (404 / route not found on every case except possibly "unauthenticated").

- [ ] **Step 3: S3 client checksum setting and PUT signer**

In `back/src/libs/databases/s3.ts`, add `PutObjectCommand` to the `@aws-sdk/client-s3` import, then:

```ts
export const S3 = new S3Client({
    region: isProd ? 'auto' : 'eu-west-1',
    endpoint: config.r2.endpoint,
    // RustFS (used for local dev) only supports path-style bucket addressing
    forcePathStyle: !isProd,
    // By default the SDK adds a CRC32 of the body to presigned URLs. The body doesn't exist
    // at signing time so it signs the checksum of an empty body, which R2 rejects.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretKey
    }
});
```

Below `getPresignedUrl`:

```ts
export const getPresignedPutUrl = async (params: {
    bucket: string;
    key: string;
    contentType: string;
    contentLength: number;
}) => {
    const cmd = new PutObjectCommand({
        Bucket: params.bucket,
        Key: params.key,
        ContentType: params.contentType,
        ContentLength: params.contentLength
    });
    // Content-Type is not signed by default: without signableHeaders the URL accepts any
    // mime type. Content-Length is signed automatically once ContentLength is set.
    return getSignedUrl(S3, cmd, {
        expiresIn: 900,
        signableHeaders: new Set(['content-type'])
    });
};
```

- [ ] **Step 4: `prepareS3FileInTransaction`**

In `back/src/libs/modules/s3files/index.ts`, change the s3 import to `import { getPresignedPutUrl, getPresignedUrl, S3 } from '../../databases/s3.js';` and add after `createS3FileInTransaction`:

```ts
// Inserts a pending S3Files row (uploadedDateUnix = NULL) and returns a presigned PUT URL.
// The client uploads to that URL, then confirmS3FileUpload() marks the row uploaded.
export const prepareS3FileInTransaction = async (
    conn: PoolConnection,
    params: {
        bucket: ManagedBuckets;
        s3Key: string;
        contentType: string;
        sizeBytes: number;
    }
) => {
    const { bucket, s3Key, contentType, sizeBytes } = params;

    await conn.query(
        `INSERT INTO S3Files (bucket, s3Key, creationDateUnix, uploadedDateUnix) VALUES (?, ?, UNIX_TIMESTAMP(), NULL)`,
        [bucket, s3Key]
    );

    return getPresignedPutUrl({
        bucket,
        key: s3Key,
        contentType,
        contentLength: sizeBytes
    });
};
```

- [ ] **Step 5: Reactor constants and module function**

Create `back/src/libs/modules/reactor/constants.ts`:

```ts
export const REACTOR_ALLOWED_MIMES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;
export type ReactorMime = (typeof REACTOR_ALLOWED_MIMES)[number];

export const REACTOR_MAX_SIZE_BYTES = 10 * 1024 * 1024;

// Pending uploads older than this are deleted by reapAbandonedUploads().
// Well above the 15 min presigned URL expiry.
export const ABANDONED_UPLOAD_AGE_SEC = 3600;
```

Create `back/src/libs/modules/reactor/prepareEntryUpload.ts`:

```ts
import mime from 'mime-types';
import { db } from '../../databases/db.js';
import { handleDuplicateEntry } from '../../errors/dbHelpers.js';
import { createS3Key, prepareS3FileInTransaction } from '../s3files/index.js';
import { ReactorMime } from './constants.js';

type PrepareEntryUploadParams = {
    name: string;
    tags: string[];
    mimetype: ReactorMime;
    sizeBytes: number;
};

export const prepareEntryUpload = async (params: PrepareEntryUploadParams) => {
    const { name, tags, mimetype, sizeBytes } = params;

    const extension = mime.extension(mimetype) || undefined;
    const { linkId, s3Key } = createS3Key({ filename: name, extension });

    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
        await conn.query(
            `INSERT INTO Reactor (name, tags, linkId, s3Key, creationDateUnix) VALUES (?, ?, ?, ?, UNIX_TIMESTAMP())`,
            [name, JSON.stringify(tags), linkId, s3Key]
        );

        const uploadUrl = await prepareS3FileInTransaction(conn, {
            bucket: 'reactor',
            s3Key,
            contentType: mimetype,
            sizeBytes
        });
        await conn.commit();
        return { linkId, uploadUrl };
    } catch (error) {
        await conn.rollback();
        handleDuplicateEntry(error, 'ITEM_ALREADY_EXISTS');
    } finally {
        conn.release();
    }
};
```

Replace `back/src/libs/modules/reactor/index.ts` with (keeps `addEntry` until Task 6):

```ts
import { addEntry } from './addEntry.js';
import { getEntriesForPublic } from './getEntries.js';
import { FileRequiredError } from './errors.js';
import { prepareEntryUpload } from './prepareEntryUpload.js';

export * from './constants.js';
export { addEntry, getEntriesForPublic, FileRequiredError, prepareEntryUpload };
```

- [ ] **Step 6: Route**

Create `back/src/libs/routes/reactor/prepareUpload.ts`:

```ts
import { FromSchema } from 'json-schema-to-ts';
import { PostRoute, RouteHandler } from '../types.js';
import {
    prepareEntryUpload,
    REACTOR_ALLOWED_MIMES,
    REACTOR_MAX_SIZE_BYTES
} from '../../modules/reactor/index.js';

const handler: RouteHandler<Input> = (params) => {
    params.loggableContext.addData('entryName', params.input.name);
    return prepareEntryUpload(params.input);
};

const inputSchema = {
    type: 'object',
    required: ['name', 'tags', 'mimetype', 'sizeBytes'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1 },
        tags: { type: 'array', items: { type: 'string' } },
        mimetype: { type: 'string', enum: REACTOR_ALLOWED_MIMES },
        sizeBytes: { type: 'integer', minimum: 1, maximum: REACTOR_MAX_SIZE_BYTES }
    }
} as const;

const outputSchema = {
    type: 'object',
    required: ['linkId', 'uploadUrl'],
    additionalProperties: false,
    properties: {
        linkId: { type: 'string' },
        uploadUrl: {
            type: 'string',
            description: 'Presigned PUT URL. The upload must use the declared Content-Type and size.'
        }
    }
} as const;

type Input = FromSchema<typeof inputSchema>;

export const route: PostRoute<Input, FromSchema<typeof outputSchema>> = {
    method: 'post',
    path: '/reactor/prepareUpload',
    inputSchema,
    handler,
    authentication: 'user2',
    scope: 'admin',
    clientErrors: ['ITEM_ALREADY_EXISTS'],
    outputSchema
};
```

In `back/src/libs/routes/index.ts`, add next to the other reactor imports:

```ts
import { route as Reactor_prepareUpload } from './reactor/prepareUpload.js';
```

and `Reactor_prepareUpload,` to `routes.list` next to `Reactor_getEntry,`.

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm run build && npm run tests -- -f 'reactor/prepareUpload'`
Expected: PASS. Then `npm run tests -- -f 'clipboard'` - still PASS (shared client change).

- [ ] **Step 8: Commit**

```bash
git add back/src back/tests/routes/reactor/prepareUpload.test.ts
git commit -m "Reactor - Add prepareUpload route signing presigned PUT URLs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `POST /reactor/confirmUpload`

**Files:**
- Modify: `back/tests/helpers/s3/index.ts`
- Modify: `back/src/libs/modules/s3files/index.ts`, `back/src/libs/modules/s3files/errors.ts`
- Modify: `back/src/libs/errors/codes.ts`
- Create: `back/src/libs/modules/reactor/confirmEntryUpload.ts`
- Modify: `back/src/libs/modules/reactor/index.ts`
- Create: `back/src/libs/routes/reactor/confirmUpload.ts`
- Modify: `back/src/libs/routes/index.ts`
- Test: `back/tests/routes/reactor/confirmUpload.test.ts`

**Interfaces:**
- Consumes: pending `S3Files` rows created by `prepareEntryUpload` (Task 2).
- Produces:
    - `UploadNotFoundError` (`UPLOAD_NOT_FOUND`, 400) exported from `s3files/errors.ts`
    - `confirmS3FileUpload(params: { bucket: ManagedBuckets; s3Key: string }): Promise<void>`
    - `confirmEntryUpload(linkId: string): Promise<void>`
    - route `POST /reactor/confirmUpload`, input `{ linkId }`, empty output
    - test helper: keys containing `notuploaded` make `HeadObject` reject with a 404; `checkCall` accepts `'HeadObject'`

- [ ] **Step 1: Extend the S3 test helper**

Replace `back/tests/helpers/s3/index.ts` with:

```ts
import {
    DeleteObjectCommand,
    DeleteObjectCommandInput,
    GetObjectCommand,
    HeadObjectCommand,
    HeadObjectCommandInput,
    PutObjectCommand,
    PutObjectCommandInput
} from '@aws-sdk/client-s3';
import { assert } from 'chai';
import { s3Mock } from '../../../src/libs/databases/s3.js';
import { TestHelper } from '../TestHelper.js';

const commandsByType = {
    DeleteObject: DeleteObjectCommand,
    GetObject: GetObjectCommand,
    HeadObject: HeadObjectCommand,
    PutObject: PutObjectCommand
};

class TestHelper_S3 extends TestHelper {
    constructor() {
        super({
            name: 'S3',
            hooks: {
                beforeEach: () => {
                    s3Mock.reset();

                    // TODO See if we want to have a finer way to fail calls to S3
                    // For now any call with a key containing should_fail will fail
                    s3Mock
                        .on(
                            PutObjectCommand,
                            // @ts-expect-error looks like .on is not typed to expect a matcher even if it works
                            (params: Partial<PutObjectCommandInput>) => {
                                return params.Key?.includes('shouldfail');
                            }
                        )
                        .rejects(new Error('Simulated failure'));

                    s3Mock
                        .on(
                            DeleteObjectCommand,
                            // @ts-expect-error looks like .on is not typed to expect a matcher even if it works
                            (params: Partial<DeleteObjectCommandInput>) => {
                                return params.Key?.includes('shouldfail');
                            }
                        )
                        .rejects(new Error('Simulated failure'));

                    // HeadObject on a key containing notuploaded behaves like a missing object
                    s3Mock
                        .on(
                            HeadObjectCommand,
                            // @ts-expect-error looks like .on is not typed to expect a matcher even if it works
                            (params: Partial<HeadObjectCommandInput>) => {
                                return params.Key?.includes('notuploaded');
                            }
                        )
                        .rejects(
                            Object.assign(new Error('NotFound'), {
                                name: 'NotFound',
                                $metadata: { httpStatusCode: 404 }
                            })
                        );
                }
            }
        });
    }

    checkNbCalls = (params: { nbCalls: number }) => {
        assert.equal(s3Mock.calls().length, params.nbCalls);
    };

    checkCall = (params: {
        commandType: keyof typeof commandsByType;
        input: { [key: string]: string };
    }) => {
        assert.isNotEmpty(s3Mock.commandCalls(commandsByType[params.commandType]));

        if (params.input) {
            const c = s3Mock.calls().pop();
            if (!c) {
                return assert.fail();
            }

            // c.args[0] is the Command instance; .input holds the SDK call parameters
            const actualInput =
                (c.args[0] as unknown as { input?: Record<string, unknown> })?.input ?? {};

            for (const key of Object.keys(params.input)) {
                const expectedValue = params.input[key];
                const actualValue = actualInput[key];
                assert.equal(
                    actualValue,
                    expectedValue,
                    `S3 input mismatch for "${key}"\n  expected: ${JSON.stringify(expectedValue)}\n  actual:   ${JSON.stringify(actualValue)}\n  full input: ${JSON.stringify(actualInput, null, 2)}`
                );
            }
        }
    };
}
export const testHelper_S3 = new TestHelper_S3();
```

Note: `assert.exists` on an array always passed; `assert.isNotEmpty` now really checks the command was sent. If an existing test starts failing on this line, it was asserting a call that never happened - report it, don't loosen the check.

- [ ] **Step 2: Write the failing tests**

Create `back/tests/routes/reactor/confirmUpload.test.ts`:

```ts
import request from 'supertest';
import { app } from '../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../helpers/index.js';

const pendingFixture = (s3Key: string, uploadedDateUnix: number | null = null) => ({
    Reactor: [
        {
            id: 1,
            name: 'entry name',
            tags: '[]',
            creationDateUnix: 10,
            linkId: 'aabbccdd',
            s3Key
        }
    ],
    S3Files: [{ bucket: 'reactor', s3Key, creationDateUnix: 10, uploadedDateUnix }]
});

describe('reactor/confirmUpload', () => {
    describe('should fail', () => {
        it('when unauthenticated', async () => {
            await request(app).post('/reactor/confirmUpload').send({ linkId: 'aabbccdd' }).expect(401);
        });

        it('on unknown linkId', async () => {
            await th.mysql.fixture({ Reactor: [] });

            await request(app)
                .post('/reactor/confirmUpload')
                .set('Cookie', th.auth2.getPassportSessionCookie())
                .send({ linkId: 'aabbccdd' })
                .expect(400)
                .then((response) => {
                    assert.deepEqual(response.body, { httpStatus: 400, code: 'ITEM_NOT_FOUND' });
                });

            th.s3.checkNbCalls({ nbCalls: 0 });
        });

        it('when the object is not in the bucket - row stays pending', async () => {
            await th.mysql.fixture(pendingFixture('aabbccdd_notuploaded.png'));

            await request(app)
                .post('/reactor/confirmUpload')
                .set('Cookie', th.auth2.getPassportSessionCookie())
                .send({ linkId: 'aabbccdd' })
                .expect(400)
                .then((response) => {
                    assert.deepEqual(response.body, { httpStatus: 400, code: 'UPLOAD_NOT_FOUND' });
                });

            await th.mysql.checkContains({
                S3Files: [{ s3Key: 'aabbccdd_notuploaded.png', uploadedDateUnix: null }]
            });
        });
    });

    it('should mark the file uploaded after checking it exists', async () => {
        await th.mysql.fixture(pendingFixture('aabbccdd_entry-name.png'));

        await request(app)
            .post('/reactor/confirmUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send({ linkId: 'aabbccdd' })
            .expect(200);

        th.s3.checkNbCalls({ nbCalls: 1 });
        th.s3.checkCall({
            commandType: 'HeadObject',
            input: { Bucket: 'reactor', Key: 'aabbccdd_entry-name.png' }
        });

        await th.mysql.checkContains({
            S3Files: [
                { s3Key: 'aabbccdd_entry-name.png', uploadedDateUnix: th.mysql.aroundNowSec }
            ]
        });
    });

    it('should be idempotent on an already confirmed file', async () => {
        await th.mysql.fixture(pendingFixture('aabbccdd_entry-name.png', 20));

        await request(app)
            .post('/reactor/confirmUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send({ linkId: 'aabbccdd' })
            .expect(200);

        await th.mysql.checkContains({
            S3Files: [{ s3Key: 'aabbccdd_entry-name.png', uploadedDateUnix: 20 }]
        });
    });

    it('should make the entry readable once confirmed', async () => {
        await th.mysql.fixture(pendingFixture('aabbccdd_entry-name.png'));

        await request(app).get('/r/aabbccdd').expect(400);

        await request(app)
            .post('/reactor/confirmUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send({ linkId: 'aabbccdd' })
            .expect(200);

        await request(app).get('/r/aabbccdd').expect(302);
    });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run build && npm run tests -- -f 'reactor/confirmUpload'`
Expected: FAIL (route not found).

- [ ] **Step 4: Error code and error class**

In `back/src/libs/errors/codes.ts`, under `// Route-level business errors`, after `'TOO_MANY_ENTRIES',` add:

```ts
    'UPLOAD_NOT_FOUND',
```

Append to `back/src/libs/modules/s3files/errors.ts`:

```ts
export class UploadNotFoundError extends AppError {
    constructor() {
        super({ code: 'UPLOAD_NOT_FOUND', httpStatus: 400 });
    }
}
```

- [ ] **Step 5: `confirmS3FileUpload`**

In `back/src/libs/modules/s3files/index.ts`: add `HeadObjectCommand, S3ServiceException` to the `@aws-sdk/client-s3` import, add `UploadNotFoundError` to the `./errors.js` import, and add after `prepareS3FileInTransaction`:

```ts
// Checks the object really is in the bucket before marking the row uploaded.
// Size and content type are not compared: they are pinned by the presigned URL signature.
export const confirmS3FileUpload = async (params: { bucket: ManagedBuckets; s3Key: string }) => {
    const { bucket, s3Key } = params;

    try {
        await S3.send(new HeadObjectCommand({ Bucket: bucket, Key: s3Key }));
    } catch (error) {
        if ((error as S3ServiceException).$metadata?.httpStatusCode === 404) {
            slog.log('s3Files', 'Upload to confirm is not in the bucket', { bucket, s3Key });
            throw new UploadNotFoundError();
        }
        throw error;
    }

    await db.query(
        'UPDATE S3Files SET uploadedDateUnix = UNIX_TIMESTAMP() WHERE bucket = ? AND s3Key = ? AND uploadedDateUnix IS NULL',
        [bucket, s3Key]
    );
};
```

- [ ] **Step 6: `confirmEntryUpload`**

Create `back/src/libs/modules/reactor/confirmEntryUpload.ts`:

```ts
import { RowDataPacket } from 'mysql2/promise';
import { db } from '../../databases/db.js';
import { slog } from '../logging/index.js';
import { confirmS3FileUpload } from '../s3files/index.js';
import { ItemNotFoundError } from '../s3files/errors.js';

interface s3KeyResult extends RowDataPacket {
    s3Key: string;
}

export const confirmEntryUpload = async (linkId: string) => {
    const [rows] = await db.query<s3KeyResult[]>('SELECT s3Key FROM Reactor WHERE linkId = ?', [
        linkId
    ]);
    if (!rows.length) {
        slog.log('reactor', 'entry not found', { linkId });
        throw new ItemNotFoundError();
    }

    await confirmS3FileUpload({ bucket: 'reactor', s3Key: rows[0].s3Key });
};
```

In `back/src/libs/modules/reactor/index.ts` add `import { confirmEntryUpload } from './confirmEntryUpload.js';` and `confirmEntryUpload` to the export list.

- [ ] **Step 7: Route**

Create `back/src/libs/routes/reactor/confirmUpload.ts`:

```ts
import { FromSchema } from 'json-schema-to-ts';
import { EmptyOutput, PostRoute, RouteHandler } from '../types.js';
import { confirmEntryUpload } from '../../modules/reactor/index.js';
import { emptyObjectSchema } from '../helpers.js';

const handler: RouteHandler<Input> = async (params) => {
    const { linkId } = params.input;
    params.loggableContext.addData('linkId', linkId);
    await confirmEntryUpload(linkId);
};

const inputSchema = {
    type: 'object',
    required: ['linkId'],
    additionalProperties: false,
    properties: {
        linkId: { type: 'string', minLength: 1 }
    }
} as const;

type Input = FromSchema<typeof inputSchema>;

export const route: PostRoute<Input, EmptyOutput> = {
    method: 'post',
    path: '/reactor/confirmUpload',
    inputSchema,
    handler,
    authentication: 'user2',
    scope: 'admin',
    clientErrors: ['ITEM_NOT_FOUND', 'UPLOAD_NOT_FOUND'],
    outputSchema: emptyObjectSchema
};
```

In `back/src/libs/routes/index.ts` add `import { route as Reactor_confirmUpload } from './reactor/confirmUpload.js';` and `Reactor_confirmUpload,` to `routes.list` next to `Reactor_prepareUpload,`.

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm run build && npm run tests -- -f 'reactor'` then `npm run tests -- -f 'clipboard'`
Expected: all PASS (clipboard re-run covers the stricter `checkCall`).

- [ ] **Step 9: Commit**

```bash
git add back/src back/tests/helpers/s3/index.ts back/tests/routes/reactor/confirmUpload.test.ts
git commit -m "Reactor - Add confirmUpload route verifying the object with HeadObject

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Exclude pending entries from the public listing

**Files:**
- Modify: `back/src/libs/modules/reactor/getEntries.ts` (`getEntriesForPublic`)
- Test: `back/tests/routes/reactor/getEntriesForPublic.test.ts`

**Interfaces:**
- Consumes: `S3Files.uploadedDateUnix` (Task 1).
- Produces: `getEntriesForPublic()` unchanged signature; only entries with an uploaded file, ordered by `Reactor.id`.

- [ ] **Step 1: Write the failing test and repurpose the "missing S3File" test**

The JOIN makes entries without an `S3Files` row disappear silently, so the existing second test ("should ignore the entries with missing S3File but log the issue") no longer logs. Keep the logging path covered with a soft-deleted file, which still passes the JOIN and makes `getPresignedURLForKey` throw. Replace that whole second `it(...)` with:

```ts
    it('should ignore entries whose S3File was deleted but log the issue', async () => {
        await th.mysql.fixture({
            Reactor: [
                {
                    id: 1,
                    name: 'entry 1',
                    tags: '["tag1","tag2"]',
                    creationDateUnix: 10,
                    linkId: 'aaaaaaaa',
                    s3Key: 'foo'
                },
                {
                    id: 2,
                    name: 'entry 2',
                    tags: '[]',
                    creationDateUnix: 50,
                    linkId: 'bbbbbbbb',
                    s3Key: 'bar'
                }
            ],
            S3Files: [
                { bucket: 'reactor', s3Key: 'foo', creationDateUnix: 10, uploadedDateUnix: 10 },
                {
                    bucket: 'reactor',
                    s3Key: 'bar',
                    creationDateUnix: 50,
                    uploadedDateUnix: 50,
                    deletionDateUnix: 60
                }
            ]
        });

        await request(app)
            .get('/reactor/getEntriesForPublic')
            .set('Accept', 'application/json')
            .expect(200)
            .then((response) => {
                assert.lengthOf(response.body, 1);
                assert.propertyVal(response.body[0], 'name', 'entry 1');
            });

        th.slog.checkLog('reactor', 'error while enriching entry', {
            entryName: 'entry 2'
        });
    });

    it('should silently skip entries pending upload or without S3File', async () => {
        await th.mysql.fixture({
            Reactor: [
                {
                    id: 1,
                    name: 'uploaded',
                    tags: '[]',
                    creationDateUnix: 10,
                    linkId: 'aaaaaaaa',
                    s3Key: 'foo'
                },
                {
                    id: 2,
                    name: 'pending',
                    tags: '[]',
                    creationDateUnix: 20,
                    linkId: 'bbbbbbbb',
                    s3Key: 'bar'
                },
                {
                    id: 3,
                    name: 'no file',
                    tags: '[]',
                    creationDateUnix: 30,
                    linkId: 'cccccccc',
                    s3Key: 'baz'
                }
            ],
            S3Files: [
                { bucket: 'reactor', s3Key: 'foo', creationDateUnix: 10, uploadedDateUnix: 10 },
                { bucket: 'reactor', s3Key: 'bar', creationDateUnix: 20, uploadedDateUnix: null }
            ]
        });

        await request(app)
            .get('/reactor/getEntriesForPublic')
            .set('Accept', 'application/json')
            .expect(200)
            .then((response) => {
                assert.deepEqual(
                    response.body.map((e: { name: string }) => e.name),
                    ['uploaded']
                );
            });
    });
```

- [ ] **Step 2: Add `checkNoLog` to the slog helper**

Today `getPresignedURLForKey` already throws for pending / missing files, so the response of the new test is already right - what changes is that those entries must no longer produce an error log. Add a negative assertion to `back/tests/helpers/slog/index.ts`, next to `checkLog` (`slogSpy` is the module-level spy already defined there):

```ts
    checkNoLog = (component: string, message: string) => {
        sinon.assert.neverCalledWith(slogSpy, component, message);
    };
```

`neverCalledWith` matches calls whose first two arguments are `component, message`, whatever the data argument.

At the end of the "should silently skip entries pending upload or without S3File" test, add:

```ts
        th.slog.checkNoLog('reactor', 'error while enriching entry');
```

- [ ] **Step 3: Run tests to verify the new one fails**

Run: `npm run build && npm run tests -- -f 'reactor/getEntriesForPublic'`
Expected: "should silently skip entries pending upload or without S3File" FAILS on `checkNoLog` (both skipped entries are logged today). The other tests PASS.

- [ ] **Step 4: JOIN in `getEntriesForPublic`**

In `back/src/libs/modules/reactor/getEntries.ts`:

```ts
export const getEntriesForPublic = async () => {
    // Only entries whose file is confirmed in the bucket: pending uploads are not listed
    const [entries] = await db.query<DBReactorEntryForPublic[]>(
        `SELECT r.name, r.tags, r.creationDateUnix, r.s3Key, r.linkId
        FROM Reactor r
        JOIN S3Files s ON s.bucket = 'reactor' AND s.s3Key = r.s3Key
        WHERE s.uploadedDateUnix IS NOT NULL
        ORDER BY r.id`
    );
    return await enrichEntries(entries);
};
```

Also add `linkId: string;` to `DBReactorEntryForPublic` (it is selected and used in `enrichEntries` but missing from the interface).

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run build && npm run tests -- -f 'reactor'`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add back/src/libs/modules/reactor/getEntries.ts back/tests/routes/reactor/getEntriesForPublic.test.ts back/tests/helpers/slog/index.ts
git commit -m "Reactor - Only list entries whose upload is confirmed

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Reap abandoned uploads

**Files:**
- Modify: `back/src/libs/modules/s3files/index.ts`
- Create: `back/src/libs/modules/reactor/reapAbandonedUploads.ts`
- Modify: `back/src/libs/modules/reactor/index.ts`
- Modify: `back/src/libs/PeriodicTasks/index.ts`
- Test: `back/tests/periodicTasks/reactor/reactor.test.ts`

**Interfaces:**
- Consumes: `ABANDONED_UPLOAD_AGE_SEC` (Task 2), `DeleteObject` `shouldfail` mock (Task 3).
- Produces:
    - `deleteAbandonedS3FileInTransaction(conn: PoolConnection, params: { bucket: ManagedBuckets; s3Key: string }): Promise<void>` - the spec names this `deleteAbandonedS3File`; it takes the caller's connection so the `S3Files` and `Reactor` deletes commit together, following the existing `...InTransaction` naming.
    - `reapAbandonedUploads(): Promise<void>`

- [ ] **Step 1: Write the failing tests**

Create `back/tests/periodicTasks/reactor/reactor.test.ts`:

```ts
import { reapAbandonedUploads } from '../../../src/libs/modules/reactor/index.js';
import { th } from '../../helpers/index.js';

const now = () => Math.round(Date.now() / 1000);

const entry = (id: number, s3Key: string, createdAgoSec: number, uploadedDateUnix: number | null) => ({
    reactor: {
        id,
        name: `entry ${id}`,
        tags: '[]',
        creationDateUnix: now() - createdAgoSec,
        linkId: `0000000${id}`,
        s3Key
    },
    s3File: { bucket: 'reactor', s3Key, creationDateUnix: now() - createdAgoSec, uploadedDateUnix }
});

const fixture = async (entries: ReturnType<typeof entry>[]) => {
    await th.mysql.fixture({
        Reactor: entries.map((e) => e.reactor),
        S3Files: entries.map((e) => e.s3File)
    });
};

describe('periodic task - reapAbandonedUploads', () => {
    it('deletes a pending upload older than one hour', async () => {
        await fixture([entry(1, 'stale.png', 2 * 3600, null)]);

        await reapAbandonedUploads();

        th.s3.checkNbCalls({ nbCalls: 1 });
        th.s3.checkCall({ commandType: 'DeleteObject', input: { Bucket: 'reactor', Key: 'stale.png' } });
        await th.mysql.checkTableLength('Reactor', 0);
        await th.mysql.checkTableLength('S3Files', 0);
        th.slog.checkLog('reactor', 'Deleted abandoned upload', {
            entryName: 'entry 1',
            s3Key: 'stale.png'
        });
    });

    it('keeps a pending upload younger than one hour', async () => {
        await fixture([entry(1, 'fresh.png', 10 * 60, null)]);

        await reapAbandonedUploads();

        th.s3.checkNbCalls({ nbCalls: 0 });
        await th.mysql.checkTableLength('Reactor', 1);
        await th.mysql.checkTableLength('S3Files', 1);
    });

    it('keeps an old confirmed upload', async () => {
        await fixture([entry(1, 'confirmed.png', 2 * 3600, now() - 2 * 3600 + 30)]);

        await reapAbandonedUploads();

        th.s3.checkNbCalls({ nbCalls: 0 });
        await th.mysql.checkTableLength('Reactor', 1);
        await th.mysql.checkTableLength('S3Files', 1);
    });

    it('keeps the rows when the S3 delete fails and still processes the other entries', async () => {
        await fixture([
            entry(1, 'shouldfail.png', 2 * 3600, null),
            entry(2, 'stale.png', 2 * 3600, null)
        ]);

        await reapAbandonedUploads();

        th.s3.checkNbCalls({ nbCalls: 2 });
        await th.mysql.checkContains({
            Reactor: [{ id: 1, s3Key: 'shouldfail.png' }],
            S3Files: [{ s3Key: 'shouldfail.png', uploadedDateUnix: null }]
        });
        await th.mysql.checkTableLength('Reactor', 1);
        await th.mysql.checkTableLength('S3Files', 1);
        th.slog.checkLog('reactor', 'Failed to delete abandoned upload', {
            entryName: 'entry 1',
            s3Key: 'shouldfail.png'
        });
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run build`
Expected: FAIL to compile - `reapAbandonedUploads` is not exported.

- [ ] **Step 3: `deleteAbandonedS3FileInTransaction`**

In `back/src/libs/modules/s3files/index.ts`, after `confirmS3FileUpload`:

```ts
// Removes a never-confirmed upload. DeleteObject succeeds even if nothing was uploaded.
// The row is hard-deleted: the file never existed from the app's point of view,
// deletionDateUnix keeps meaning "was live, then deleted".
export const deleteAbandonedS3FileInTransaction = async (
    conn: PoolConnection,
    params: { bucket: ManagedBuckets; s3Key: string }
) => {
    const { bucket, s3Key } = params;
    await S3.send(new DeleteObjectCommand({ Bucket: bucket, Key: s3Key }));
    await conn.query(
        'DELETE FROM S3Files WHERE bucket = ? AND s3Key = ? AND uploadedDateUnix IS NULL',
        [bucket, s3Key]
    );
};
```

- [ ] **Step 4: `reapAbandonedUploads`**

Create `back/src/libs/modules/reactor/reapAbandonedUploads.ts`:

```ts
import { RowDataPacket } from 'mysql2/promise';
import { db } from '../../databases/db.js';
import { slog } from '../logging/index.js';
import { deleteAbandonedS3FileInTransaction } from '../s3files/index.js';
import { ABANDONED_UPLOAD_AGE_SEC } from './constants.js';

interface AbandonedEntry extends RowDataPacket {
    id: number;
    name: string;
    s3Key: string;
}

// Deletes entries prepared with prepareEntryUpload() but never confirmed,
// freeing their name and linkId.
export const reapAbandonedUploads = async () => {
    const [entries] = await db.query<AbandonedEntry[]>(
        `SELECT r.id, r.name, r.s3Key
        FROM Reactor r
        JOIN S3Files s ON s.bucket = 'reactor' AND s.s3Key = r.s3Key
        WHERE s.uploadedDateUnix IS NULL
        AND s.creationDateUnix < UNIX_TIMESTAMP() - ?`,
        [ABANDONED_UPLOAD_AGE_SEC]
    );

    for (const entry of entries) {
        const conn = await db.getConnection();
        await conn.beginTransaction();
        try {
            // S3 first: if it fails the rows stay and the next run retries
            await deleteAbandonedS3FileInTransaction(conn, { bucket: 'reactor', s3Key: entry.s3Key });
            await conn.query('DELETE FROM Reactor WHERE id = ?', [entry.id]);
            await conn.commit();
            slog.log('reactor', 'Deleted abandoned upload', {
                entryName: entry.name,
                s3Key: entry.s3Key
            });
        } catch (error) {
            await conn.rollback();
            slog.log('reactor', 'Failed to delete abandoned upload', {
                entryName: entry.name,
                s3Key: entry.s3Key,
                error: error as Error
            });
        } finally {
            conn.release();
        }
    }
};
```

In `back/src/libs/modules/reactor/index.ts` add `import { reapAbandonedUploads } from './reapAbandonedUploads.js';` and `reapAbandonedUploads` to the export list.

- [ ] **Step 5: Register the periodic task**

In `back/src/libs/PeriodicTasks/index.ts` add `import { reapAbandonedUploads } from '../modules/reactor/index.js';` and append to `tasks`:

```ts
    new PeriodicTask({
        taskName: 'Reactor abandoned uploads',
        task: reapAbandonedUploads,
        intervalMinutes: 60
    })
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run build && npm run tests -- -f 'reapAbandonedUploads'`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add back/src back/tests/periodicTasks/reactor
git commit -m "Reactor - Periodically delete abandoned uploads

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Remove `addEntry`, regenerate the SDK, switch the front end

**Files:**
- Delete: `back/src/libs/routes/reactor/addEntry.ts`, `back/src/libs/modules/reactor/addEntry.ts`, `back/src/libs/modules/reactor/errors.ts`, `back/tests/routes/reactor/addEntry.test.ts`
- Modify: `back/src/libs/routes/index.ts`, `back/src/libs/modules/reactor/index.ts`, `back/src/libs/errors/codes.ts`
- Regenerate: `packages/sdk/src/generated/*`
- Modify: `front/src/lib/Reactor/api.ts`, `front/src/routes/(apps)/reactor/components/ReactorForm.svelte`

**Interfaces:**
- Consumes: SDK methods `client2.reactor.prepareUpload(input)` → `{ linkId, uploadUrl }` and `client2.reactor.confirmUpload({ linkId })` (generated in this task).
- Produces: front `uploadToReactor(input: { name: string; tags: string[] }, file: File): Promise<void>`, `REACTOR_ALLOWED_MIMES`, `REACTOR_MAX_SIZE_BYTES`, `isReactorMime(mimetype: string): boolean`.

- [ ] **Step 1: Remove the backend route**

```bash
git rm back/src/libs/routes/reactor/addEntry.ts back/src/libs/modules/reactor/addEntry.ts back/src/libs/modules/reactor/errors.ts back/tests/routes/reactor/addEntry.test.ts
```

In `back/src/libs/routes/index.ts` delete the `Reactor_addEntry` import and its `routes.list` entry.

`back/src/libs/modules/reactor/index.ts` becomes:

```ts
import { confirmEntryUpload } from './confirmEntryUpload.js';
import { getEntriesForPublic } from './getEntries.js';
import { prepareEntryUpload } from './prepareEntryUpload.js';
import { reapAbandonedUploads } from './reapAbandonedUploads.js';

export * from './constants.js';
export { confirmEntryUpload, getEntriesForPublic, prepareEntryUpload, reapAbandonedUploads };
```

In `back/src/libs/errors/codes.ts` delete the `'FILE_REQUIRED',` line. Then confirm nothing else uses it:

Run: `grep -rn "FILE_REQUIRED\|FileRequiredError" back/src back/tests front/src`
Expected: no output.

- [ ] **Step 2: Backend checks**

Run (in `back/`): `npm run check && npm run build && npm run tests -- -f 'reactor'`
Expected: PASS.

- [ ] **Step 3: Regenerate the SDK**

Run (in `back/`): `npm run generate:sdk`
Then: `git diff --stat ../packages/sdk` - expect `reactor.addEntry` gone, `reactor.prepareUpload` and `reactor.confirmUpload` present with no `file` parameter:

Run: `grep -n "prepareUpload\|confirmUpload\|reactor/addEntry" ../packages/sdk/src/generated/routes.ts`
Expected: `prepareUpload` and `confirmUpload` lines, no `reactor/addEntry`.

- [ ] **Step 4: Front API helper**

Replace `front/src/lib/Reactor/api.ts` with:

```ts
import { client2 } from '$lib/api';

// Must match the backend limits in back/src/libs/modules/reactor/constants.ts
export const REACTOR_ALLOWED_MIMES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;
type ReactorMime = (typeof REACTOR_ALLOWED_MIMES)[number];
export const REACTOR_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const isReactorMime = (mimetype: string): mimetype is ReactorMime =>
    (REACTOR_ALLOWED_MIMES as readonly string[]).includes(mimetype);

export const getReactionsForPublic = client2.reactor.getEntriesForPublic;

// 1. the API reserves the entry and signs an upload URL
// 2. the browser uploads the file straight to the bucket
// 3. the API checks the file is there and publishes the entry
export const uploadToReactor = async (input: { name: string; tags: string[] }, file: File) => {
    if (!isReactorMime(file.type)) {
        throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
    }

    const { linkId, uploadUrl } = await client2.reactor.prepareUpload({
        ...input,
        mimetype: file.type,
        sizeBytes: file.size
    });

    // Plain fetch, not client2: this goes to the bucket, not our API, and must not carry cookies
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
    });
    if (!response.ok) {
        throw new Error(
            `Upload to storage failed (HTTP ${response.status}). The name "${input.name}" stays reserved for up to 2 hours: retry later or use another name.`
        );
    }

    await client2.reactor.confirmUpload({ linkId });
};
```

- [ ] **Step 5: Form**

In `front/src/routes/(apps)/reactor/components/ReactorForm.svelte`, change the import to:

```ts
    import { isReactorMime, REACTOR_MAX_SIZE_BYTES, uploadToReactor } from '$lib/Reactor';
```

Replace the `upload` function with:

```ts
    const validateFile = (file: File | undefined) => {
        if (!file) {
            fieldErrors.file = 'A file must be uploaded';
        } else if (!isReactorMime(file.type)) {
            fieldErrors.file = 'Only png, jpeg, gif and webp images are allowed';
        } else if (file.size > REACTOR_MAX_SIZE_BYTES) {
            fieldErrors.file = 'The file must be 10 MB or less';
        } else {
            fieldErrors.file = '';
        }
    };

    const upload = async () => {
        noticeMessages = [];
        validateName();

        const file = files?.[0];
        validateFile(file);

        if (Object.values(fieldErrors).some((e) => e) || !file) {
            return;
        }

        try {
            uploading = true;
            const tagList = tags
                .split(',')
                .map((tag) => tag.trim())
                .filter((tag) => tag.length);
            await uploadToReactor({ name, tags: tagList }, file);
            onUpload();
        } catch (error) {
            handleFormError(error);
        } finally {
            uploading = false;
        }
    };
```

And under `<FormFileInput bind:files />` add:

```svelte
        {#if fieldErrors.file}
            <span class="field-error">{fieldErrors.file}</span>
        {/if}
```

- [ ] **Step 6: Front checks**

Run (in `front/`): `npm run check && npm run build`
Expected: PASS. If `npm run format` fails on the edited files, run `npm run format:fix` and re-run `npm run check`.

- [ ] **Step 7: Commit**

```bash
git add -A back/src back/tests packages/sdk front/src
git commit -m "Reactor - Replace multipart addEntry with direct-to-bucket upload

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Local CORS, docs, full verification

**Files:**
- Modify: `back/src/libs/databases/s3.ts` (`initS3`)
- Modify: `back/REPO_OVERVIEW.md`

**Interfaces:**
- Consumes: everything above.
- Produces: a working local upload against RustFS.

- [ ] **Step 1: Bucket CORS for local dev**

In `back/src/libs/databases/s3.ts` add `PutBucketCorsCommand` to the `@aws-sdk/client-s3` import, and at the end of `initS3()`:

```ts
    // Browsers upload Reactor files straight to the bucket with presigned PUT URLs.
    // In prod the equivalent rule is managed in terraform (cloudflare_r2_bucket_cors).
    console.log('S3 init - Set reactor bucket CORS');
    await S3.send(
        new PutBucketCorsCommand({
            Bucket: 'reactor',
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedMethods: ['PUT'],
                        AllowedOrigins: ['https://localhost:8080'],
                        AllowedHeaders: ['content-type'],
                        ExposeHeaders: ['ETag'],
                        MaxAgeSeconds: 3600
                    }
                ]
            }
        })
    );
```

`initS3` returns early in tests, so no automated test covers this; Step 4 verifies it.

- [ ] **Step 2: Docs**

In `back/REPO_OVERVIEW.md`, the Reactor feature bullet's endpoint line becomes:

```markdown
    - Endpoints: `prepareUpload`, `confirmUpload` (direct browser → R2 upload through presigned PUT URLs), `getEntriesForPublic`, `getEntry`. Abandoned uploads are deleted by a periodic task.
```

- [ ] **Step 3: Full automated verification**

Run (in `back/`): `npm run check && npm run build && npm run tests:all`
Run (in `front/`): `npm run check && npm run build`
Expected: all PASS. Paste the summary lines (passing/failing counts) into the task report.

- [ ] **Step 4: Manual local verification - ask the user**

This needs a browser and the local stack, which the agent cannot drive. Ask the user to:

1. Recreate the local `S3Files` table (`./src/tools/init-db.sh` in `back/`) or run the `ALTER` from the spec on the local DB.
2. Restart `npm run serve` (so `initS3` applies the CORS rule) and `npm run dev` in `front/`.
3. On `https://localhost:8080/reactor/create`, upload a png under 10 MB. Expect: devtools shows `prepareUpload` 200, an `OPTIONS` + `PUT` to `127.0.0.1:24566` with 200, `confirmUpload` 200, and the entry visible on `/reactor`. No mixed-content warning.
4. Try a `.txt` file and a file over 10 MB: the form shows the field error and makes no request.

- [ ] **Step 5: Commit**

```bash
git add back/src/libs/databases/s3.ts back/REPO_OVERVIEW.md
git commit -m "Reactor - Set local bucket CORS for direct uploads

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## After the plan (user, outside this repo)

From the spec's rollout section, not executed by the agent:

1. Prod DB: `ALTER TABLE S3Files ADD COLUMN uploadedDateUnix int(11) unsigned DEFAULT NULL;` then `UPDATE S3Files SET uploadedDateUnix = creationDateUnix;`
2. Terraform repo: add `cloudflare_r2_bucket_cors.reactor` (block in the spec) and `terraform apply`.
3. Deploy backend (`npm run prod:deploy`).
4. Straight after, before any Reactor upload: `UPDATE S3Files SET uploadedDateUnix = creationDateUnix WHERE uploadedDateUnix IS NULL;` (rows inserted by the old code since step 1).
5. Deploy frontend.
6. Upload one image in prod to confirm R2 accepts the presigned PUT with `WHEN_REQUIRED` checksums.
