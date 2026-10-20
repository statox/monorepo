# Reactor: direct-to-R2 uploads with presigned PUT URLs

Date: 2026-10-13

Research: [`superpowers/brainstorming/2026-08-31-s3-upload-rework-research.md`](../brainstorming/2026-08-31-s3-upload-rework-research.md) and [`2026-08-31-checksum-gotcha-explained.md`](../brainstorming/2026-08-31-checksum-gotcha-explained.md).

## Context

`POST /reactor/addEntry` is a multipart route: the browser uploads the file to the API (multer, `/tmp`, global 5 MB cap), and the API forwards it to R2 with `PutObject` inside `createS3FileInTransaction`, which also inserts the `S3Files` row. The DB row exists because the API witnessed the upload succeed.

This rework moves Reactor to a three-step flow: the API signs a presigned `PUT` URL, the browser uploads straight to R2, and the API verifies the object exists before marking it uploaded. `S3Files` stays the MySQL mirror of the bucket and the single read-gate for presigned GETs.

## Goals and scope

- Reactor file bytes no longer transit through the API.
- Uploads are restricted for real (today nothing enforces mime or size beyond the multer 5 MB cap):
    - mime types: `image/png`, `image/jpeg`, `image/gif`, `image/webp`
    - size: 1 byte to 10 MB (10 485 760 bytes)
    - enforced at prepare time by JSON schema, and at upload time by R2 through the signature.
- A file is only readable once the API has confirmed it exists in the bucket.
- Abandoned uploads (prepare without confirm) are cleaned up and stop squatting `Reactor.name` / `linkId`.
- Works in local dev against RustFS and in prod against R2.

Out of scope:

- **Clipboard** keeps the multipart route and `createS3FileInTransaction` unchanged (apart from setting the new column). The new `s3files` helpers are generic so Clipboard can migrate later.
- R2 lifecycle rules, R2 event notifications.
- Replacing a pending row on name conflict: a failed upload holds its name until the cleanup task removes it.

## Schema

`src/tools/tables/S3Files.sql` gains one column:

```sql
`uploadedDateUnix` int(11) unsigned DEFAULT NULL,
```

- `NULL` means pending: the row was created by a prepare step and the object has not been confirmed in the bucket.
- Non-`NULL` means the object is confirmed to exist.
- There is no migration tooling (`CREATE TABLE IF NOT EXISTS`), so prod is migrated by hand, before deploying the backend. The old code ignores the column, so running this ahead of the deploy is safe, but rows it inserts afterwards are NULL - hence the second backfill in [Rollout](#rollout):

```sql
ALTER TABLE S3Files ADD COLUMN uploadedDateUnix int(11) unsigned DEFAULT NULL;
UPDATE S3Files SET uploadedDateUnix = creationDateUnix;
```

No change to the `Reactor` table.

## S3 client (`src/libs/databases/s3.ts`)

- `S3Client` gets `requestChecksumCalculation: 'WHEN_REQUIRED'`. Without it, `@aws-sdk/client-s3` adds `x-amz-checksum-crc32` (the CRC32 of an empty body) to presigned URLs, which R2 is documented to reject. The setting is client-wide, so the remaining `PutObject` calls (Clipboard) also stop sending checksums - harmless.
- New `getPresignedPutUrl({ bucket, key, contentType, contentLength })`:
    - signs `new PutObjectCommand({ Bucket, Key, ContentType, ContentLength })`
    - with `{ expiresIn: 900, signableHeaders: new Set(['content-type']) }`
    - `signableHeaders` is required: by default `Content-Type` is not signed and a client can upload any mime type with the URL. `ContentLength` is signed automatically once set.
    - resulting `X-Amz-SignedHeaders` is `content-length;content-type;host`.
- The existing `getPresignedUrl` (GET) is unchanged.
- `initS3()` (local dev only), after creating the buckets, sends a `PutBucketCorsCommand` on `reactor`:
    - allowed methods `PUT`, allowed origins `https://localhost:8080`, allowed headers `content-type`, expose headers `ETag`, max age 3600.
    - applied on every startup (idempotent).

## `s3files` module (`src/libs/modules/s3files/`)

New functions:

- `prepareS3FileInTransaction(conn, { bucket, s3Key, contentType, sizeBytes }): Promise<string>`
    - inserts `S3Files (bucket, s3Key, creationDateUnix = UNIX_TIMESTAMP(), uploadedDateUnix = NULL)` using the caller's transaction
    - returns the URL from `getPresignedPutUrl`.
- `confirmS3FileUpload({ bucket, s3Key }): Promise<void>`
    - sends `HeadObjectCommand`. A 404 (`$metadata.httpStatusCode === 404`) throws `UploadNotFoundError`. Any other error propagates (500 + Slack alert via the error middleware).
    - then `UPDATE S3Files SET uploadedDateUnix = UNIX_TIMESTAMP() WHERE bucket = ? AND s3Key = ? AND uploadedDateUnix IS NULL`. Confirming twice is a no-op.
    - Size and content type returned by `HeadObject` are not compared: only the API can sign, and the signature pins both, so any object at that key was uploaded through our URL.
- `deleteAbandonedS3File({ bucket, s3Key }): Promise<void>`
    - sends `DeleteObjectCommand` (succeeds even if the object was never uploaded), then hard-deletes the `S3Files` row. Hard delete because the file never existed from the app's point of view; `deletionDateUnix` keeps meaning "was live, then deleted".

Changed functions:

- `getPresignedURLForKey` also selects `uploadedDateUnix` and throws `ItemNotFoundError` when it is `NULL`.
- `createS3FileInTransaction` (Clipboard) inserts `uploadedDateUnix = UNIX_TIMESTAMP()`.

New error in `s3files/errors.ts`:

- `UploadNotFoundError` - code `UPLOAD_NOT_FOUND`, http 400. Added to `ERROR_CODES` in `src/libs/errors/codes.ts`.

## Reactor routes and module

### `POST /reactor/prepareUpload` (new)

- `authentication: 'user2'`, `scope: 'admin'`, plain JSON (not a file route).
- Input schema (`additionalProperties: false`, all required):
    - `name`: string, `minLength: 1`
    - `tags`: array of strings. Real JSON now, so `commaSeparatedTags` goes away.
    - `mimetype`: enum `image/png`, `image/jpeg`, `image/gif`, `image/webp`
    - `sizeBytes`: integer, `minimum: 1`, `maximum: 10485760`
- Invalid mime / size fail schema validation with the generic `INPUT_VALIDATION_FAILED`; no dedicated error codes. The front validates the same limits first for a readable message.
- Module `prepareEntryUpload({ name, tags, mimetype, sizeBytes })`:
    1. computes `{ linkId, s3Key }` with `createS3Key`, extension from `mime.extension(mimetype)` (as `addEntry` does today)
    2. in one transaction: inserts the `Reactor` row, calls `prepareS3FileInTransaction`, commits
    3. on duplicate key: rollback, `handleDuplicateEntry(error, 'ITEM_ALREADY_EXISTS')`. This now fires at prepare time, before any bytes are sent.
- Output: `{ linkId: string, uploadUrl: string }`.
- `clientErrors: ['ITEM_ALREADY_EXISTS']`.

### `POST /reactor/confirmUpload` (new)

- `authentication: 'user2'`, `scope: 'admin'`.
- Input: `{ linkId: string }`.
- Module `confirmEntryUpload(linkId)`: selects the `Reactor` row's `s3Key` by `linkId` (missing → `ItemNotFoundError`), then `confirmS3FileUpload({ bucket: 'reactor', s3Key })`.
- Output: empty object.
- `clientErrors: ['ITEM_NOT_FOUND', 'UPLOAD_NOT_FOUND']`.

### Removed

- Route `src/libs/routes/reactor/addEntry.ts`, module `src/libs/modules/reactor/addEntry.ts`, `tests/routes/reactor/addEntry.test.ts`.
- `FileRequiredError` (`reactor/errors.ts`) and `FILE_REQUIRED` from `ERROR_CODES` - Reactor is their only user.

### Reads

- `getEntriesForPublic`: query becomes `Reactor JOIN S3Files ON S3Files.bucket = 'reactor' AND S3Files.s3Key = Reactor.s3Key WHERE S3Files.uploadedDateUnix IS NOT NULL`, so pending entries are skipped silently instead of each one logging an error inside `enrichEntries`.
- `GET /r/:linkId`: no code change. `getPresignedURLForKey` rejects pending rows with `ITEM_NOT_FOUND`.

### Cleanup of abandoned uploads

- `reapAbandonedUploads()` in the reactor module:
    1. selects `Reactor.id, Reactor.s3Key` joined with `S3Files` (bucket `reactor`) where `uploadedDateUnix IS NULL AND S3Files.creationDateUnix < UNIX_TIMESTAMP() - 3600`
    2. for each: `deleteAbandonedS3File({ bucket: 'reactor', s3Key })`, then `DELETE FROM Reactor WHERE id = ?`
    3. S3 delete runs first: if it fails, both rows stay and the next run retries.
    4. a failing entry is logged with `slog.log('reactor', ...)` and the loop continues.
- Registered in `src/libs/PeriodicTasks/index.ts` as `'Reactor abandoned uploads'`, `intervalMinutes: 60`, no Slack on failure.
- Periodic tasks only run in prod, so in local dev pending rows are not reaped.
- With a 15 min URL expiry, 1 h threshold and 60 min interval, a failed upload's name is freed after 1 to 2 h.

### SDK

`npm run generate:sdk` after the route changes (`addEntry` removed, `prepareUpload` and `confirmUpload` added).

## Front end

- `front/src/lib/Reactor/api.ts`: `uploadToReactor({ name, tags }, file)` keeps its name and runs the three steps:
    1. `client2.reactor.prepareUpload({ name, tags, mimetype: file.type, sizeBytes: file.size })`
    2. `fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })` - plain `fetch`, not `client2`, so no cookies go to R2. The browser sets `Content-Length`. A non-ok response throws.
    3. `client2.reactor.confirmUpload({ linkId })`
- `ReactorForm.svelte`:
    - before submitting, checks `file.type` is one of the four allowed mime types and `file.size <= 10 MB`; shows a field error otherwise
    - splits the tags string into an array (trimmed, empties dropped) before calling `uploadToReactor`
    - on failure after prepare, shows that the upload failed and the name stays reserved for a while (retry later or use another name).

## Infrastructure (terraform repo, not this monorepo)

Add to `api/r2.tf`:

```terraform
resource "cloudflare_r2_bucket_cors" "reactor" {
  account_id   = var.cloudflare_account_id
  bucket_name  = cloudflare_r2_bucket.reactor.name
  jurisdiction = "eu"
  rules = [{
    id = "browser-direct-upload"
    allowed = {
      methods = ["PUT"]
      origins = ["https://apps.statox.fr", "https://localhost:8080"]
      headers = ["content-type"]
    }
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }]
}
```

The live buckets have no CORS configuration, so this is a pure create.

## Error handling summary

| Step | Condition | Result |
|---|---|---|
| prepareUpload | bad mime / size / missing field | 400 `INPUT_VALIDATION_FAILED` |
| prepareUpload | name or linkId already exists (including a pending entry) | 400 `ITEM_ALREADY_EXISTS` |
| prepareUpload | DB failure | rollback, 500. Nothing to undo in S3: signing is local. |
| PUT to R2 | size or content type differs from what was signed | 403 from R2, front shows an error |
| confirmUpload | unknown `linkId` | 400 `ITEM_NOT_FOUND` |
| confirmUpload | `HeadObject` 404 | 400 `UPLOAD_NOT_FOUND`, row stays pending |
| confirmUpload | other `HeadObject` error | 500 + Slack alert |
| confirmUpload | already confirmed | 200, no change |
| cleanup task | S3 or DB error on one entry | logged, entry retried next run, loop continues |

## Testing

### Test helper (`tests/helpers/s3/index.ts`)

- Mock `HeadObjectCommand`: resolves by default; keys containing `notuploaded` reject with a `NotFound` error carrying `$metadata: { httpStatusCode: 404 }` (mirrors the existing `shouldfail` convention for `PutObject`).
- Add a `shouldfail` rejection for `DeleteObjectCommand` to test the cleanup failure path.
- `checkCall` `commandType` union gains `'HeadObject'` (and `'GetObject'`, which the body already handles but the type omits).

### New tests

- `tests/routes/reactor/prepareUpload.test.ts`
    - success: `Reactor` row and `S3Files` row with `uploadedDateUnix: null`; zero S3 calls; returned `uploadUrl` targets the `reactor` bucket and the row's `s3Key`, its query has `X-Amz-SignedHeaders=content-length;content-type;host` and no `x-amz-checksum-crc32` (locks both SDK gotchas)
    - duplicate name → `ITEM_ALREADY_EXISTS`, no new rows
    - non-image mime, `sizeBytes` over 10 MB, `sizeBytes: 0` → `INPUT_VALIDATION_FAILED`
    - no session → 401
- `tests/routes/reactor/confirmUpload.test.ts`
    - success sets `uploadedDateUnix` (`aroundNowSec`), one `HeadObject` call
    - `HeadObject` 404 → `UPLOAD_NOT_FOUND`, `uploadedDateUnix` stays `null`
    - unknown `linkId` → `ITEM_NOT_FOUND`
    - second confirm → 200, timestamp unchanged
- `tests/routes/reactor/getEntriesForPublic.test.ts` and `getEntry.test.ts`: a pending entry is excluded / returns `ITEM_NOT_FOUND`.
- `tests/periodicTasks/reactor/reactor.test.ts` (same layout as `tests/periodicTasks/homeTracker/homeTracker.test.ts`): stale pending entry deleted with one `DeleteObject` call; fresh pending entry kept; confirmed entry kept; `DeleteObject` failure keeps both rows and logs.

### Existing tests to update

- Every fixture that seeds `S3Files` and expects a presigned GET must set `uploadedDateUnix`: reactor `getEntry`, `getEntriesForPublic`; clipboard `getPublicEntries`, `getAllEntries`, `staticView`.
- Clipboard `addEntry` assertions on `S3Files` check `uploadedDateUnix` is set.
- `tests/routes/reactor/addEntry.test.ts` is deleted.

### Verification

- `back/`: `npm run check`, `npm run tests:all`.
- `front/`: its check / lint / build scripts.
- Manual: a local upload through the Reactor form against RustFS (also settles the `https://localhost:8080` → `http://127.0.0.1:24566` mixed-content question).

## Rollout

1. Run the `ALTER` + `UPDATE` on the prod DB.
2. `terraform apply` the R2 CORS rule.
3. Deploy the backend.
4. Straight after the backend deploy, before any Reactor upload, re-run the backfill: `UPDATE S3Files SET uploadedDateUnix = creationDateUnix WHERE uploadedDateUnix IS NULL;`. Rows inserted by the old code (Clipboard or Reactor `addEntry`) between step 1 and the deploy have `uploadedDateUnix = NULL`: left as is, a Clipboard one makes `clipboard/getEntries` fail for the whole listing, and a Reactor one gets deleted by the cleanup task after 1 h.
5. Deploy the frontend. Between the backend and frontend deploys the old form calls the removed `addEntry`: acceptable for a single-user tool.
6. Upload one image in prod: confirms R2 accepts the presigned PUT with `WHEN_REQUIRED` checksums (the last untested assumption from the research).
