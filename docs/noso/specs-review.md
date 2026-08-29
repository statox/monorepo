> [!INFO] Generated with the following prompt:
>
> ```
> Check @docs/noso/specs.md
> 
> I don't want you to design or implement anything for now, we are reviewing this document.
> 
> Outside of the questions already present in the document do you see
> 
> - Implicit questions
> - Uncertain statements which would require more investigation
> - Gaps in the document
> ```
> With Opus 5 and effort high

---

## 0. TODO

- [ ] Change the upload flow: We'll use presigned urls too so that the files don't go through the server
- [ ] Describe local storage service. Check if we should reuse existing helpers/patterns from the other apps.
- [ ] Spike authentication

## 1. Implicit questions

- [ ] **Nothing resolves a userId to a username.** `UserIcon` (line 159-161) shows "the initials of the user" and `/user/[id]` (line 181) shows "the username" — but no endpoint returns it, and `getFeed`'s per-post payload is never specified. Related: how does a user *discover* other users to navigate to `/user/[id]`? There's no user-list endpoint.

- [x] **The post↔media association doesn't exist in the data model.** `NOSO_Media` (lines 35-41) has `id`, `userId`, `creationDateUnix`, `s3link` — no `postId`, and there's no join table. But `getFeed` (line 83) says "Select in `NOSO_Media` the ids of the media associated with each post". Nothing associates them. This is the single biggest hole; it also decides several downstream questions: can one media be attached to two posts? Is the media order within a post preserved (nothing stores rank)? Does `addPost` reject a mediaId that's already attached?

- [x] **`noso/getMedia` — "For now, user ownership check" (line 88) contradicts the feature.** A shared family feed means everyone views everyone else's images. If `getMedia` is owner-only, `Post` (line 149) can only render your own media. Is this a typo for "*no* ownership check" (i.e. any `noso`-scoped user can fetch any noso media)? Either way, the actual authorization rule needs stating.

- [x] **`getFeed` never mentions `archiveDateUnix`.** Soft delete is defined (line 32) but the retrieval steps (lines 81-84) don't filter archived posts. Also: does a user see their *own* archived posts on `/user/[id]`? And should `getMedia` still serve media belonging to a deleted post?

- [x] **Pagination cursor is not unique.** Every existing table stores timestamps as `int(11) unsigned` seconds. Two posts in the same second means `<` skips one and `<=` duplicates one. Is the cursor a bare timestamp or a `(creationDateUnix, id)` tuple? Is the boundary inclusive? And how does `Feed` (line 140) know it's reached the end — is "fewer than 10 returned" the contract, or is there an explicit `hasMore`?

- [x] **The 300-character limit has two different statements.** Line 16 says "Max 300 characters" as a hard rule; line 33 says "we'll limit to 300 char but we want to occasionally allow larger text". Enforced where — JSON schema `maxLength`, UI only, or both? And "occasionally allow larger" by what mechanism?

- [x] **`/createPost` abort semantics leave orphans and have no retry story** (lines 174-176). If media 3 of 4 fails, media 1-2 are already in R2 and `NOSO_Media`. "Media cleanup" is deferred (line 199) — but that item is about media never attached, which is the same class of garbage. Separately: if `addPost` fails *after* all uploads succeed and the user hits submit again, do the files get re-uploaded (duplicates)?

- [x] **Front-end URLs don't match the doc.** The scaffold is `front/src/routes/(noso)/noso/`, so the real paths are `/noso`, `/noso/createPost`, `/noso/user/[id]` — not `/` and `/createPost` (lines 165-182). Is NoSo meant to live under `apps.statox.fr/noso`, or eventually its own host? That decision affects the "independent style" claim and where an unauthenticated visitor gets redirected.

- [x] **Where does a logged-out family member land?** The login page is `front/src/routes/(apps)/auth/login/+page.svelte` — inside the `(apps)` group, with the apps `<Header />` and apps stylesheets. "Reuse the existing auth component from apps as much as possible" (line 104) doesn't say whether family users see the apps-branded login and app index.

- [x] **`Post` shows "the creation date (or update date instead)" (line 147)** — undecided, and `updateDateUnix` (line 30) is written by no endpoint in this phase (edition is deferred, line 197).

---

## 2. Uncertain statements that need investigation

- [ ] **"We removed SvelteModal recently" (line 157) is not true in the working tree.** `svelte-modals` is still in `front/package.json:47` and used in six files — including the NoSo scaffold itself (`front/src/routes/(noso)/noso/+layout.svelte:5` and `+page.svelte:2`). Worth checking what was actually removed before building a dependency-free overlay on that premise.

- [ ] **Emoji support (lines 18, 186) conflicts with every existing table.** All of `back/src/tools/tables/*.sql` use `DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci` — that's MySQL's `utf8mb3`, which cannot store 4-byte emoji. Only `Sessions.sql` uses `utf8mb4`. And `back/src/libs/databases/db.ts:26-35` sets no `charset` on the pool. So "support utf8 properly with emojis" needs both a `utf8mb4` column/table *and* a connection-charset check — and would be the first table in the repo to diverge. Verify with an actual insert test.

- [ ] **"the existing client `back/src/libs/databases/s3.ts`" (line 36) is not where uploads happen.** Uploading goes through `back/src/libs/modules/s3files/index.ts` (`createS3FileInTransaction`), which always inserts a row into the shared `S3Files` table. Three places hardcode the bucket list: `ManagedBuckets = 'clipboard' | 'reactor'` (s3files/index.ts:12), `requiredBuckets = ['clipboard','reactor']` (`s3.ts:38`, local dev bucket creation), and the Terraform side you mention (line 46). This also makes `NOSO_Media.s3link` ambiguous: is it an FK to `S3Files.id`, or a duplicated `bucket`+`s3Key`?

- [ ] **"similar to `clipboard/addEntry` and `reactor/addEntry`" (line 63) inherits validation that doesn't exist.** Those routes declare `file: { maxSize: 200, allowedMimes: ['image'] }` — but `back/src/libs/middleware/multipart.middleware.ts` never reads either field. The mime filter is commented out (lines 19-27) and the only real limit is a global multer `fileSize: 5 * 1024 * 1024`. So reuse gives you: no mime validation, no per-route size limit, and a **hard 5 MB cap**. Straight-from-phone photos routinely exceed that. Also `upload.single('file')` — one file per request, which is consistent with your one-`addMedia`-call-per-file design, but worth being explicit about.

- [ ] **"All the tests helpers (db, s3, auth) should be available" (line 92) — mostly true, one gap.** `th.auth2.setupAuth2User` does support extra users with custom scopes (`back/tests/helpers/auth2/index.ts:37`), which you need for the ownership tests. `th.s3` mocks Put/Delete/Get. But S3 failure injection is keyed on the key containing `shouldfail` (`tests/helpers/s3/index.ts:24`), and I found no helper covering `getSignedUrl` (the presigner) — check how `getMedia`-style presigning is asserted today.

- [ ] **Adding the `noso` scope touches four places, one of which fails loudly if missed.** `SCOPES` in `back/src/libs/routes/types.ts:53`; the *duplicated* `Scope` union in `front/src/lib/auth/types.ts`; and — easy to miss — `back/src/libs/routes/auth/me.ts:66`, which hardcodes `enum: ['admin','public','homeTracker','personalTracker']` in the **output** schema. A `noso` user calling `/auth/me` would trip output validation.

- [ ] Reassuring, verified: `auth_passport.middleware.ts:245` gives `admin` a blanket bypass, and everything else is strict scope matching. So a `noso`-only user reaches noso routes plus the three `public`-scope routes (`auth/login`, `auth/logout`, `auth/me`) and nothing else. Worth writing down, since this is the first time non-you humans get API accounts.

- [ ] **Fetching media via JS (lines 117-119) is a different tradeoff than `<img src>`.** `MediaService.getMedia` calls the presigned link and returns data to the component. That requires CORS on the R2 bucket for the front origin (an `<img src>` wouldn't), and it bypasses normal browser image caching — which directly works against your "Image speed load" open question. Presigned URLs expire in 3600s (`s3.ts:33`).

- [ ] **"It has an independent style for the other apps" (line 100)** — currently independent only by omission. `(noso)/noso/+layout.svelte` imports `highlightjs_*` and `helpers.css` but not `new.css`/`new_theme.css`. There's no NoSo stylesheet yet.

---

## 3. Gaps

- [ ] **Static-site prerendering will break `/noso/user/[id]`.** `front/src/routes/(noso)/noso/+layout.js` sets `export const prerender = true` and the whole site builds with `adapter-static` (`fallback: '404.html'`). A dynamic param route can't be prerendered without a `entries()` function. Nothing in the doc addresses this.

- [ ] **No migration story.** Tables come from `back/src/tools/init-db.sh` concatenating `tables/*.sql` with `CREATE TABLE IF NOT EXISTS`. That's fine for a fresh DB, but the doc never says how prod acquires `NOSO_Post`/`NOSO_Media`. Also: no existing table uses real FK constraints — is "userId: Reference to `User`" an actual FK or a convention?

- [ ] **No error codes.** Every route declares `clientErrors` from the manually-maintained list in `back/src/libs/errors/codes.ts`. The doc names rejection cases ("reject if the media are not owned", "reject if the post to delete is not owned") without codes; new entries are needed and the list has a "must add here" comment.

- [ ] **No SDK regeneration step**, despite `CLAUDE.md` requiring one per route change (`npm run generate:sdk`, `back/package.json:12`). Also unmentioned: registering the module in `back/src/libs/routes/index.ts`, and the OpenAPI output.

- [ ] **No thumbnails, no image dimensions, no derivatives.** "Image speed load" (line 185) is framed as a Svelte-code problem, but the actual levers — serving smaller variants, and storing width/height to reserve layout space — have no support in the data model or backend. Layout shift matters specifically for the `Media` square-with-margins constraint (line 156).

- [ ] **Front-end test tooling doesn't exist at all.** `front/package.json` has no vitest, no playwright, no test script — only `svelte-check`, `lint`, `format`. The "Client side test" open question (line 188) is really "adopt a test framework from scratch", which is a bigger call than it reads.

- [ ] **No limits or abuse controls, and no explicit decision to skip them.** I found no rate limiting anywhere in `back/src`, no per-user storage quota, no cap on media-per-post. Small trusted audience makes "none" defensible — but it should be a stated "no", especially since this is the first multi-human deployment.

- [ ] **`getFeed`'s response shape is never specified** — which fields per post, whether username is included, what `mediaIds` looks like. You need this to write the output schema and the SDK types.

- [ ] **Media lifecycle on post deletion is undefined.** `deletePost` soft-deletes the post; the S3 objects and `NOSO_Media` rows are untouched, and anyone holding a mediaId can still presign. The deferred "Media cleanup" item (line 199) only covers media that were never attached.

- [ ] **Section "### Data storage" (line 106) is empty**, and only `MediaService` is defined under Services — nothing covers the post/feed API orchestration that `Feed` and `/createPost` both need.

- [ ] **Unspecified UI states**: empty feed, loading, error, end-of-feed (when to hide "load more"), and a user with zero posts. Also no `<svelte:head>` title/favicon or `+error.svelte` for the `(noso)` group, and no alt-text/a11y story for images.

- [ ] **Local dev S3**: the `noso` bucket needs adding to `requiredBuckets` for RustFS, and the test fixtures need a `noso`-bucket path — neither is mentioned alongside the Terraform note.
