# Reactor presigned-URL upload — pre-design research

Date: 2026-08-31
Status: research complete, design not started

Recap of the investigation done before designing the refactor of
`back/src/libs/routes/reactor/addEntry.ts`.

## 1. Goal

Move `reactor/addEntry` off "client uploads to the API, API forwards to R2" and onto
"API mints a presigned URL, client PUTs straight to R2" — while keeping
`back/src/libs/modules/s3files/` as the place where files are tracked in MySQL.

## 2. What exists today

**S3 client** (`back/src/libs/databases/s3.ts:19`) — one `S3Client`, `region: 'auto'` in
prod / `eu-west-1` locally, `forcePathStyle` off in prod and on locally for RustFS,
credentials from `config.r2`. `getPresignedUrl()` already exists at line 30 but is
hardcoded to `GetObjectCommand` / 3600s. **The presigner dependency is already installed
and working** — adding PUT extends this function, it isn't new infrastructure.

**Tracking** (`back/src/libs/modules/s3files/index.ts`)

- `S3Files`: `id, bucket, s3Key, creationDateUnix, deletionDateUnix`. The `UNIQUE KEY` is
  on `s3Key` **alone**, not `(bucket, s3Key)`.
- `createS3FileInTransaction()` does `PutObject` → `INSERT INTO S3Files` inside a
  caller-owned transaction. **This is the crux of the refactor: the DB row exists only
  because the API performed the upload and witnessed it succeed.** That witness
  disappears with presigned URLs.
- Not truly atomic even now — the object lands in R2 before `conn.commit()`, so a commit
  failure orphans the object.
- `getPresignedURLForKey()` gates every read on the `S3Files` row existing and not being
  soft-deleted. That gate is what you'd lose if a file could exist in R2 without a row.

**Current upload path** — `multipartHandler` (multer, disk storage in `/tmp`, global 5 MB
cap) → `params.file: ApiFile` → `reactor/addEntry` computes `linkId` + `s3Key`, inserts
the `Reactor` row, calls `createS3FileInTransaction`, commits.

**Validation is decorative.** `route.file.maxSize: 200` and `allowedMimes: ['image']`
appear in `types.ts` and in the two route declarations and are **read nowhere**. Multer's
`fileFilter` is commented out. The only real limit today is the global 5 MB, and there is
no mime checking at all. Nothing is lost by moving to presigned URLs — but this is the
moment to actually implement it.

## 3. Verified empirically against the local RustFS

Reached on `127.0.0.1:24566` (host networking; `apistatox.rustfs` doesn't resolve, the
published port does). Bucket list was empty so `reactor` was created — same thing
`initS3()` does. Probe objects and the CORS config set during the probe were deleted
afterwards; the local env is clean.

| Check | Result |
|---|---|
| `PutBucketCors` / `GetBucketCors` | Supported, round-trips correctly |
| `OPTIONS` preflight from `https://localhost:8080` | 200, correct allow-origin/methods/headers + max-age |
| Presigned `PUT` from that origin | 200, `ETag` exposed |
| `HeadObject` after upload | Real `ContentLength` / `ContentType` / `ETag` |
| `HeadObject` on a never-uploaded key | Throws `NotFound`, `$metadata.httpStatusCode === 404` |
| Tampered key in the URL | 403 `SignatureDoesNotMatch` |

Local dev is fully viable, and confirm-by-`HeadObject` is testable end to end.

### Two SDK gotchas — both would have shipped broken

1. **Checksums.** `@aws-sdk/client-s3` is `3.1114.0`, which appends
   `x-amz-checksum-crc32=AAAAAA==&x-amz-sdk-checksum-algorithm=CRC32` to the presigned
   URL — a CRC32 of the *empty* body, because there is no body at signing time. RustFS
   ignores it; R2 is documented to validate it. Fix: `requestChecksumCalculation:
   'WHEN_REQUIRED'` on the `S3Client`. Verified the params disappear and the PUT still
   succeeds. Client-level setting, so it also stops existing `PutObject` calls sending
   checksums — harmless, but shared.

2. **`ContentType` is not signed by default.** With a plain
   `getSignedUrl(S3, new PutObjectCommand({..., ContentType}))`, `X-Amz-SignedHeaders`
   came back as just `host`, and a file uploaded with `Content-Type: text/html` against a
   URL signed for `image/png` **got a 200**. You must pass
   `{ signableHeaders: new Set(['content-type']) }`; then `SignedHeaders` becomes
   `content-length;content-type;host` and the mismatch correctly 403s.

   `ContentLength` behaves differently — setting it signs it automatically, and an
   oversized body 403s. **So size enforcement works out of the box; mime enforcement does
   not.**

## 4. R2 constraints

- Presigned **GET, HEAD, PUT, DELETE** supported. Expiry 1 second to 7 days.
- **Presigned POST / HTML form POST policy is NOT supported.** The important one: the S3
  POST-policy `content-length-range` condition is the normal way to enforce a *maximum*
  upload size, and it's unavailable. You must sign an exact `ContentLength`. A client can
  lie about the byte count it requests, but then its own upload fails the signature check
  — it can't lie *and* upload.
- **Everything is jurisdiction-scoped.** The S3 endpoint must be
  `https://<ACCOUNT_ID>.eu.r2.cloudflarestorage.com`; wrangler needs `--jurisdiction eu`
  (alias `-J`) or it reports zero buckets; and `cloudflare_r2_bucket_cors` needs
  `jurisdiction = "eu"` or the provider looks in the wrong place.
- CORS is bucket-level and mandatory for browser PUTs. The Express `cors()` allowlist
  (`apps.statox.fr`, `localhost:8080`, `lifestudio.statox.fr` — `back/src/app.ts:56`) is
  irrelevant to a request going straight to R2. The *existing* presigned GETs never
  needed CORS because they're consumed as `<img src>` / redirects, not `fetch()`.
- R2 event notifications exist but deliver to a Cloudflare Queue, requiring a Worker to
  relay back. Real infra for a personal tool — skip it.

## 5. Infrastructure state — settled

`terraform/api/r2.tf` is live code on provider `~> 5` (locked 5.24.0), with `clipboard`,
`reactor`, `songbook` declared and imported, all `jurisdiction = "eu"`. The v4→v5
migration is complete (`cloudflare_record` → `cloudflare_dns_record`). `imports.tf` keeps
the import blocks commented as history.

**Confirmed on the live account:** the buckets are **location `eeur`, jurisdiction `eu`,
and carry no CORS configuration at all.** That resolves the last infra unknown:

- The CORS rule is a pure **create** — nothing to adopt, so `cloudflare_r2_bucket_cors`'s
  lack of `terraform import` support is a non-issue.
- The v4→v5 upgrade that was the prerequisite for any of this is already paid for. Do the
  CORS in terraform, not imperatively via wrangler.
- `location` staying unset in `r2.tf` is correct and now verified consistent: the buckets
  really are `eeur`, and since `location` is only honored at first creation and is
  best-effort, declaring it on an imported bucket only risks a permanent diff for no gain.

`songbook` is referenced only by `back/src/tools/chords/migrate-chords-from-s3.ts` (a
one-off `GetObject` on `index.json`) and is absent from both `ManagedBuckets` and
`requiredBuckets`. No browser traffic, no CORS rule needed. Worth noting terraform and the
backend now disagree about which buckets exist — a drift to be aware of, not something to
fix here.

The rule to add to `api/r2.tf` (`var.cloudflare_account_id` is wired into `module.api` via
`main.tf:27`, so this drops in as-is):

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

For local dev the equivalent belongs in `initS3()` — a `PutBucketCorsCommand` alongside
the existing `CreateBucketCommand`, which RustFS accepts.

## 6. Knock-on effects

- **Tests**: S3 is `aws-sdk-client-mock`. `getSignedUrl` signs locally without
  `client.send()`, so it keeps working — but `th.s3.checkNbCalls` / `checkCall` will see
  **zero** `PutObjectCommand` calls. The helper's whole notion of "was the file uploaded"
  stops applying; assertions shift to "was a URL signed for the right
  bucket/key/content-type" plus a mocked `HeadObject` if the confirm step verifies.
- **SDK/front**: the generator's `hasFile` flag makes reactor a multipart route; dropping
  `file` turns it into plain JSON. `uploadToReactor(input, file)` changes signature and
  `ReactorForm.svelte` becomes a three-step flow.
- **Account ID exposure**: the presigned URL's host is
  `<account_id>.eu.r2.cloudflarestorage.com`, so the client sees the account ID. Inherent
  to presigned R2 URLs — the existing presigned GETs already do it. Not a concern, just
  don't be surprised in devtools.

## 7. The resulting flow

```
1. POST /reactor/prepareUpload  {name, tags, filename, mimetype, sizeBytes}
   → validate mime + size, compute linkId + s3Key,
     write Reactor row + S3Files row as PENDING,
     sign PutObject(bucket, key, ContentType, ContentLength)
     with signableHeaders:['content-type'] on a WHEN_REQUIRED-checksum client
   → {uploadUrl, uploadId}

2. PUT uploadUrl   (browser → R2, Content-Type and Content-Length must match exactly)

3. POST /reactor/confirmUpload  {uploadId}
   → flip PENDING → uploaded
```

## 8. Open design decisions

1. **Where does pending state live?** A `uploadedDateUnix` / status column on `S3Files` is
   the natural home and keeps `getPresignedURLForKey` as the single read-gate — it would
   just also reject never-confirmed rows.
2. **Trust step 3, or verify?** Trusting is one line. Verifying is a `HeadObject` on
   confirm, yielding the real size / content-type / ETag and closing the "confirm without
   uploading" hole. Proven to work locally including the 404 path. Leaning to verifying,
   since an accurate DB mirror of the bucket is the stated goal.
3. **Who reaps abandoned uploads?** Step 3 can just never arrive. Needs a periodic task
   sweeping `S3Files` rows pending beyond N minutes (`back/src/libs/PeriodicTasks/`
   already exists) and/or an R2 lifecycle rule. Without it, dead rows squat the
   `Reactor.name` and `linkId` unique constraints.

Plus one behavioral change to be deliberate about: `ITEM_ALREADY_EXISTS` now fires at
prepare time rather than at submit. Arguably better UX, but it is a change.

## 9. Remaining unknowns

Two, both needing a real round-trip rather than a doc:

- **Mixed content in local dev.** Front dev is `https://localhost:8080`, the presigned URL
  is `http://127.0.0.1:24566`. Loopback is a potentially-trustworthy origin in both Chrome
  and Firefox so this should be allowed, but it wants a real click-through.
- **The checksum fix against real R2.** `WHEN_REQUIRED` verifiably removes the params, and
  RustFS accepts the PUT either way. That R2 specifically *rejects* the default crc32 URL
  is from Cloudflare's docs and the known SDK issue, not from a test against the live
  account. The fix is right regardless; the failure mode it prevents is the untested part.
