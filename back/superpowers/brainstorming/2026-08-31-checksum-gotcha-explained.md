# The presigned-PUT checksum gotcha, explained

Context: this documents SDK gotcha #1 from
`back/superpowers/brainstorming/2026-08-31-s3-upload-rework-research.md` (§3, "Two SDK
gotchas — both would have shipped broken") in more depth: what causes it, the S3/SigV4
parameters involved, exactly which code it touches, and an end-to-end walkthrough.

## 1. Background — what a presigned URL actually is

Normal S3 request: your server holds AWS credentials, builds a request (e.g. `PutObject`),
and **signs** it — computes a SigV4 signature over the request's method, path, headers, and
a hash of the body — then sends it. S3 recomputes the same signature server-side from what
it actually received; if they match, the request is authentic and untampered.

A **presigned URL** does the same signing step but *doesn't send the request*. Instead it
packages the signature into query-string parameters and hands the URL to someone else (the
browser) to make the actual HTTP call later. Whoever holds that URL can perform exactly the
one signed action — nothing more — until it expires. This is why Reactor wants it: the
browser PUTs the file straight to R2, and the API never has to proxy multi-MB uploads
through itself.

**The critical consequence:** because the signature is computed *before* the real request
happens, everything that goes into the signature has to be decided at signing time, from
data the API doesn't yet have (like the file's actual bytes). Both SDK gotchas in the
research doc come from exactly this gap between "what's true at sign time" and "what's true
at upload time."

## 2. The parameters involved

**Parameters the API chooses when building the `PutObjectCommand` to sign:**

| Param | Meaning | Known at sign time? |
|---|---|---|
| `Bucket` / `Key` | which object | yes — computed by the route |
| `ContentType` | MIME type the upload must declare | yes — client tells the API in `prepareUpload` |
| `ContentLength` | exact byte size the upload must match | yes — client tells the API |
| `Body` | the actual file bytes | **no** — the browser has the file, not the API |

**Parameters that end up in the final presigned URL's query string** (standard SigV4
query-presigning, added by the signer, not the caller):

| Param | Meaning |
|---|---|
| `X-Amz-Algorithm` | signing algorithm (`AWS4-HMAC-SHA256`) |
| `X-Amz-Credential` | access key + scope (date/region/service) |
| `X-Amz-Date` | when it was signed |
| `X-Amz-Expires` | validity window in seconds |
| `X-Amz-SignedHeaders` | **which request headers were included in the signature** — e.g. `content-length;content-type;host`. Any header not listed here can be changed by whoever uses the URL without invalidating the signature. This is gotcha #2: if `content-type` isn't in this list, someone can PUT with a different `Content-Type` than what you intended and the URL still works. |
| `X-Amz-Signature` | the resulting HMAC signature |

**The checksum-specific ones — this is the gotcha in question:**

| Param | Meaning |
|---|---|
| `x-amz-sdk-checksum-algorithm` | which checksum algorithm the SDK picked (`CRC32` by default) |
| `x-amz-checksum-crc32` | **the actual checksum value that gets folded into `X-Amz-SignedHeaders`/the signature.** It asserts "the body of this PUT must hash to this exact CRC32." |

That last one is added automatically and silently by the SDK's checksum middleware
(`@aws-sdk/checksums`), independent of anything the route author wrote. Since the
middleware runs at signing time — before the browser has been given the URL, let alone the
file — it can only hash the body *as it exists right then*, which is empty. So it signs a
commitment to an empty upload. It isn't a value you can override per-call by passing
something to `PutObjectCommand`; it's a client-level default
(`requestChecksumCalculation`) that fires on every command that supports checksums unless
you turn it off.

### Root cause, traced in the installed SDK (`@aws-sdk/client-s3@3.1114.0`)

- `node_modules/@aws-sdk/checksums/dist-es/submodules/flexible-checksums/constants.js` —
  default `requestChecksumCalculation` is `WHEN_SUPPORTED`, default algorithm is `CRC32`.
- `flexibleChecksumsMiddleware.js` — a `build`-step middleware. If no `x-amz-checksum-*`
  header is already present and the mode is `WHEN_SUPPORTED`, it unconditionally computes
  `stringHasher(checksumAlgorithmFn, requestBody)` and adds the result as a header.
- `@aws-sdk/s3-request-presigner/dist-es/getSignedUrl.js` — clones the client's middleware
  stack and runs it up to (but not past) `awsAuthMiddleware`, then intercepts to sign
  instead of send. The `build` step — where the checksum middleware lives — **does** run
  during presigning, even though nothing is ever transmitted.
- At presign time, `PutObjectCommand` is built with no `Body` (the API doesn't have the
  file yet), so `requestBody` is `undefined` → CRC32 of nothing → base64 `AAAAAA==`.
- `@aws-sdk/s3-request-presigner/dist-es/presigner.js` (`S3RequestPresigner.presign`) signs
  the request *after* the checksum header has been added, so it becomes part of what SigV4
  commits to.

## 3. Which code this actually impacts

Checked empirically rather than assumed — it's narrower than "every presigned URL":

- **`getPresignedUrl()` in `back/src/libs/databases/s3.ts:30`** (the function that exists
  today, used for downloads/`<img src>`) signs a `GetObjectCommand`. Tested directly against
  the same client config: **no checksum params appear.** `GetObjectCommand`'s middleware
  config (`_mw7` in the SDK's `commandBuilder.js`) has no `requestAlgorithmMember` for
  uploads — there's no request body on a GET to checksum in a way that matters. **This
  existing, shipped code is not affected.**
- **The not-yet-written `prepareUpload`/upload-presigning code** (the whole point of the
  S3-upload-rework brainstorm) will call `getSignedUrl()` on a `PutObjectCommand`.
  `PutObjectCommand` uses `_mw11`, which *does* declare a `requestAlgorithmMember`
  (`ChecksumAlgorithm`) — that's the one that triggers the bug. **This is the code that will
  ship broken if nothing changes**, because it doesn't exist yet — there's nothing to point
  at in the repo today.
- **The shared `S3` client instance** (`back/src/libs/databases/s3.ts:19`) is the fix's
  blast radius: `requestChecksumCalculation` is set once, client-wide. Setting it to
  `WHEN_REQUIRED` affects every command sent through that client, including any plain
  (non-presigned) `PutObject`/`GetObject` calls elsewhere (e.g.
  `back/src/tools/chords/migrate-chords-from-s3.ts`). That's fine — it just means "don't add
  a checksum unless the command explicitly asks for one" everywhere, which is a strictly
  safer default — but it's worth knowing the fix isn't scoped to just the new route.

## 4. End-to-end use case

**Actors:**
- **Browser** — the user's client, holds the actual file bytes, has no AWS credentials
- **Reactor API** (`back/src/libs/routes/reactor/`) — holds R2 credentials, decides what may
  be uploaded, never sees the file bytes in this design
- **R2** — Cloudflare's S3-compatible object store, the actual destination

**Scenario: user uploads `photo.png` (240 KB) to Reactor, as designed in §7 of the research
doc.**

### Step 1 — Prepare (Browser → API → API signs, doesn't upload)

- **Action:** Browser calls `POST /reactor/prepareUpload` with
  `{ filename: 'photo.png', mimetype: 'image/png', sizeBytes: 245760 }`.
- **API does:** builds
  `new PutObjectCommand({ Bucket: 'reactor', Key: s3Key, ContentType: 'image/png', ContentLength: 245760 })`,
  calls `getSignedUrl(S3, cmd, { signableHeaders: new Set(['content-type']) })`.
- **What the SDK does under the hood, unasked:** the flexible-checksums middleware sees no
  body was set on the command (correct — the API doesn't have the bytes), computes CRC32 of
  empty input, stamps `x-amz-checksum-crc32: AAAAAA==` onto the request headers *before*
  signing.
- **Result:** the API returns a URL to the browser that is cryptographically valid **only
  if the eventual upload is empty.** The API has unknowingly promised something it can't
  keep.

### Step 2 — Upload (Browser → R2 directly)

- **Action:** Browser does `PUT uploadUrl` with the real 245,760-byte PNG as the body.
- **On RustFS (local dev):** RustFS doesn't check `x-amz-checksum-crc32` against the actual
  body it received. **200 OK.** The mismatch is invisible — confirmed by actually doing this
  PUT and getting a 200 (see `back/tmp/repro-checksum-bug.mjs`). This is why the bug can sit
  in the codebase through local testing and even a green CI run.
- **On R2 (production, per Cloudflare's documented behavior):** R2 validates the checksum
  parameter against the body it actually receives. The real CRC32 of 245,760 real bytes ≠
  `AAAAAA==`. **Expected result: the PUT is rejected** (documented behavior; not yet
  verified against the live account per the research doc's remaining unknowns) — the file
  never lands in the bucket.

### Step 3 — Confirm (Browser → API)

- **Action:** Browser calls `POST /reactor/confirmUpload { uploadId }`, believing the upload
  succeeded (its own PUT looked fine from the browser's perspective if it 200'd on RustFS,
  or it errored and the user is now stuck if it 403'd on R2).
- **On RustFS:** if the confirm step does a `HeadObject` to verify (open design decision #2
  in the doc), it finds a real object with real size — everything looks consistent, because
  RustFS never enforced the promise in the first place.
- **On R2:** there is no object at that key. If confirm trusts the client blindly (the "one
  line" option in open decision #2), the `S3Files` row gets marked uploaded for a file that
  was never stored — a phantom row pointing at nothing, discovered only when someone later
  tries to view it and gets a 404 from R2.

**Net effect:** identical code, identical request shape, correct-looking behavior in every
environment the team actually tests in (RustFS, `aws-sdk-client-mock` which never calls
`send()` for presigning at all), and a silent failure only in production against R2 —
exactly the "would have shipped broken" outcome flagged in the research doc.

## 5. The fix

Already validated in §2 of the research doc and reproducible in
`back/tmp/repro-checksum-bug.mjs`: set `requestChecksumCalculation: 'WHEN_REQUIRED'` on the
shared `S3Client`. That changes the middleware's decision at the
`getChecksumAlgorithmForRequest` gate — no checksum is added unless something explicitly
requests one — so the presigned PUT stops making a promise about the body's contents at
all, and the browser's real bytes are accepted on their own terms.

```
--- default client (bug present) ---
SignedHeaders: content-length;content-type;host
x-amz-checksum-crc32: AAAAAA==
x-amz-sdk-checksum-algorithm: CRC32

--- requestChecksumCalculation: WHEN_REQUIRED (fixed) ---
SignedHeaders: content-length;content-type;host
x-amz-checksum-crc32: null
x-amz-sdk-checksum-algorithm: null

--- actually PUTting real bytes to a URL signed for empty body ---
URL asserts x-amz-checksum-crc32: AAAAAA== (checksum of "")
RustFS response: 200 OK -> should be 200 (RustFS does not validate)
Real CRC32 of the body sent was never checked. This is the gap R2 is documented to close.
```
