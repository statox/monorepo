# Audit: File Upload Flows

Covers `clipboard/addEntry` and `reactor/addEntry` — the two flows where the frontend sends a file for the backend to store.

Date: 2026-05-11

---

## Flows mapped

### clipboard/addEntry

File is optional. The form accepts either a text `content` field or a `file`, or both.

```
ClipboardForm.svelte
  → front/src/lib/Clipboard/api.ts (uploadToClipboard)
      ├─ file present  → superagent multipart POST /clipboard/addEntry
      └─ no file       → client2.clipboard.addEntry (SDK)
  → back/src/libs/routes/clipboard/addEntry.ts
  → back/src/libs/modules/clipboard/addEntry.ts
      ├─ INSERT INTO Clipboard
      └─ createS3FileInTransaction → S3 PutObject + INSERT INTO S3Files
```

### reactor/addEntry

File is always required.

```
ReactorForm.svelte
  → front/src/lib/Reactor/api.ts (uploadToReactor)
      → superagent multipart POST /reactor/addEntry  (always, no SDK path)
  → back/src/libs/routes/reactor/addEntry.ts
  → back/src/libs/modules/reactor/addEntry.ts
      ├─ INSERT INTO Reactor
      └─ createS3FileInTransaction → S3 PutObject + INSERT INTO S3Files
```

### Shared backend path

Both routes go through the same middleware pipeline:

```
loggingHandler
→ multipartHandler          (formidable — merges fields+files into req.body)
→ passport session chain    (setPassportHeaders → doPassportSession → validatePassportSession)
→ validateEndpointScope     (scope: 'admin')
→ validate                  (JSON schema via express-json-validator-middleware)
→ apiPipeline               (route handler)
→ errorHandler
```

Both business logic modules follow the same transaction pattern:
`GET CONNECTION → BEGIN → INSERT row → S3 upload + INSERT S3Files → COMMIT`
with rollback on any failure and `conn.release()` in `finally`.

---

## 1. How standard is the setup

The overall approach is reasonable. A few non-standard choices:

**`multer` vs `formidable`**
`multer` is the dominant Express multipart middleware and has better ecosystem
support. `formidable` works, but the `firstValues` helper is imported from an
internal path (`formidable/src/helpers/firstValues.js`) with `@ts-expect-error`.
That is a private API with no stability guarantee.

**Files merged into `req.body`**
`multipart.middleware.ts` does `req.body = { ...fieldsSingle, ...files }`.
This conflates two distinct concerns and forces route schemas to declare `file`
as `type: 'array'` with a manual `.pop()` to extract the single file. The
conventional pattern keeps files separate (`req.file` / `req.files` with multer).

**Type coercion in route handlers**
`clipboard/addEntry.ts` manually casts `ttlSeconds` with `Number()` and
`isPublic` with a string comparison. This is a known limitation of
`multipart/form-data` (all fields arrive as strings), acknowledged with a TODO.
The coercion belongs in middleware/schema normalization, not the handler.

**Tags as a comma-separated string**
`reactor/addEntry.ts` accepts `commaSeparatedTags` and splits it server-side
because multipart doesn't support JSON arrays. Tags are then stored as
`JSON.stringify(array)` in the DB rather than a proper JSON column or join
table. The route comment explains the constraint, which is good.

---

## 2. Issues found

### Bug — `beginTransaction()` not awaited

**Severity: high**
**Files:** `back/src/libs/modules/clipboard/addEntry.ts:39`,
           `back/src/libs/modules/reactor/addEntry.ts:29`

```typescript
const conn = await db.getConnection();
conn.beginTransaction();   // ← missing await
try {
    await conn.query(`INSERT INTO ...`);
```

`mysql2/promise`'s `beginTransaction()` returns a `Promise`. Without `await`,
the INSERT races against the transaction setup and may execute outside the
transaction context. A subsequent S3 failure then cannot roll back the DB
insert. The `conn.rollback()` in the catch block would also fail silently.

Fix: `await conn.beginTransaction();` in both modules.

### No file size limit

**Severity: low**
**File:** `back/src/libs/middleware/multipart.middleware.ts`

`formidable`'s default `maxFileSize` is 200 MB. There is no override:

```typescript
const form = new formidable.IncomingForm();  // no maxFileSize
```

Fix: set an explicit limit appropriate for the use case, e.g.:
```typescript
const form = new formidable.IncomingForm({ maxFileSize: 10 * 1024 * 1024 });
```

### User-supplied name used unsanitized in S3 key

**Severity: low**
**Files:** `back/src/libs/modules/clipboard/addEntry.ts:27`,
           `back/src/libs/modules/reactor/addEntry.ts:22`

```typescript
s3Key = `${linkId}_${name}`;
```

The raw `name` field is included in the S3 key. S3 keys allow `/`, which
creates virtual prefixes (a name like `foo/bar` produces a key in a
`foo/` pseudo-directory). Special characters may also cause confusion in
presigned URLs. Consider slugifying or encoding the name before use.

### Temp files not explicitly cleaned up

**Severity: minor**
**File:** `back/src/libs/modules/s3files/index.ts`

Formidable writes uploads to the OS temp directory. After the S3 upload
completes (or fails), the temp file is never explicitly removed:

```typescript
const fileStream = fs.createReadStream(file.filepath);
await S3.send(new PutObjectCommand({ ... Body: fileStream ... }));
// file.filepath still exists on disk
```

Fix: add `await fs.promises.unlink(file.filepath)` in a `finally` block
inside `createS3FileInTransaction`, or in the calling business logic module.

### linkId entropy

**Severity: negligible for personal use**
**File:** `back/src/libs/modules/random.ts`

4 bytes = ~4 billion possibilities. A collision throws `ITEM_ALREADY_EXISTS`
to the user. For a personal tool the probability is negligible, but 8 bytes
would eliminate it entirely with no other cost.

---

## 3. SDK integration gap

The SDK handles JSON requests but not `multipart/form-data`. Both upload flows
work around this by using `superagent` directly:

| Flow | Text/no-file path | File path |
|---|---|---|
| clipboard | `client2.clipboard.addEntry(data)` | `superagent.post(...).attach(...)` |
| reactor | — | `superagent.post(...).attach(...)` always |

Consequences:
- Two `@ts-expect-error` suppressions in the frontend API wrappers
  (`front/src/lib/Clipboard/api.ts`, `front/src/lib/Reactor/api.ts`)
- Error handling diverges: the SDK surfaces typed `ApiError` / `UserLoggedOutError`;
  the raw superagent path hits `handleFormError` with unstructured errors
- The reactor endpoint is entirely absent from the SDK for the upload direction
- The acknowledged TODO in `clipboard/api.ts` already names the fix

The standard fix is to have the SDK detect a `File` / `Blob` field and
serialize the request as `multipart/form-data` automatically, mirroring what
the frontend does manually today.

---

## 4. Dependency comparison: multer vs formidable

Run for reference when evaluating a potential switch.

| | formidable | multer |
|---|---|---|
| Total packages | 6 | 15 |
| Direct deps | 3 | 4 |
| Parsing engine | built-in | busboy (1 dep: streamsearch) |

**formidable tree**
```
formidable
├── @paralleldrive/cuid2 → @noble/hashes
├── dezalgo → asap, wrappy
└── once → wrappy
```
`dezalgo` and `once` are callback-era utilities; their presence indicates
formidable's internals have not been fully modernized to promises.
`@noble/hashes` (via cuid2) is used internally only to name temp files —
heavier than necessary for that purpose.

**multer tree**
```
multer
├── append-field
├── busboy → streamsearch
├── concat-stream → buffer-from, inherits, readable-stream
│                   (readable-stream → string_decoder → safe-buffer,
│                    inherits, util-deprecate)
│                   typedarray
└── type-is → media-typer, mime-types → mime-db
```
The bulk of multer's package count comes from `concat-stream` →
`readable-stream`, a Node.js streams backport from the pre-v10 era. On modern
Node it is dead weight. `busboy` itself (the actual parser) is lean.

Note: `mime-types` + `mime-db` are already direct dependencies of the backend,
so they would not be net-new packages if switching to multer.

**Bottom line:** multer has more packages, but its core (`busboy`) is more
actively maintained and purpose-built for Express. formidable's smaller count
partly reflects an older callback-style architecture. Neither is a meaningful
concern for a personal project; the more important factor is the private-API
import issue with `firstValues`.

---

## Summary table

| Issue | Severity | File(s) |
|---|---|---|
| `beginTransaction()` not awaited | **Bug** | `modules/clipboard/addEntry.ts:39`, `modules/reactor/addEntry.ts:29` |
| SDK does not handle file uploads | Structural debt | `front/.../Clipboard/api.ts`, `front/.../Reactor/api.ts` |
| No file size limit | Low | `middleware/multipart.middleware.ts` |
| User-supplied name in S3 key unsanitized | Low | `modules/clipboard/addEntry.ts:27`, `modules/reactor/addEntry.ts:22` |
| `firstValues` imported from internal path | Fragile | `middleware/multipart.middleware.ts:3` |
| Type coercion in handler bodies | Code smell | `routes/clipboard/addEntry.ts:16-20` |
| Temp files not explicitly cleaned up | Minor | `modules/s3files/index.ts` |
| linkId 4-byte entropy | Negligible | `modules/random.ts` |
