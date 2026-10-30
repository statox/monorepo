# Dead Code, Unused Dependencies and Removable Artifacts — Audit

**Date:** 2026-08-31
**Scope:** `api.statox.fr` (the `back/` package of `statox/monorepo`)
**Revision:** 2 — first pass was static-only; this revision adds git-history archaeology,
which resolved both open questions and **corrected eight claims**. See
"Corrections to the first pass" below.

## Method

Static analysis with `knip` (tuned config; `dist/`, `node_modules/`, `.venv/`, `tmp/`
excluded), cross-checked with manual `grep` verification of every candidate, then dated
against git history (`git log -S` / `-G` pickaxe, `--follow`, `--diff-filter=A`) over the
868 commits touching `back/`. History runs from `7437305f` (2023-11-27, "Initial commit")
to `7f9a7ce7`.

Both limitations noted in revision 1 are now lifted: the repository root is available, so
git history and `.github/workflows/` are both in scope.

---

## Corrections to the first pass

Revision 1 was written without git access, and inferred orphaning stories from code
comments and structure. History contradicted eight of those inferences. They are corrected
in place below; summarised here because several change the conclusion.

| # | Revision 1 claim | Corrected by history |
|---|---|---|
| A2 | `'apikey'` auth was "never adopted" | **Wrong.** It was adopted by `/web-stats/record` on 2026-04-12 and orphaned 2026-06-04. |
| A5 | The `modules/openapi` version is "the newer one" that superseded the tool | **Wrong.** Both files were created in the *same commit* (80b282ff, 2025-11-13). Born redundant. |
| B2 | `authError` was "superseded by the generic `error` + `errorCode` pair" | **Wrong.** Added 2025-11-11 with no call site, ever. Born dead. |
| B5 | Implied the whitelist gap arrived with the 2026-05-04 error rewrite | **Wrong.** The pre-rewrite middleware did not forward these errors either. The gap is ~2 years old and predates the rewrite. |
| C1 | `@smithy/util-stream` had "zero references anywhere" | **Imprecise.** True today, but it was genuinely used (`sdkStreamMixin`) until 2025-01-27. |
| C1 | `aws-sdk-client-mock-jest` had "zero references" | **Imprecise.** Imported until the ESM migration commented it out; the dead line was deleted 2025-01-27. |
| C2 | `github-actions-ctrf` "cannot confirm — check root workflows" | **Resolved: removable.** CI replaced `npx github-actions-ctrf` with the `ctrf-io/github-test-reporter` action on 2026-05-10; the devDependency was left behind. |
| D1 | `back/tmp/` is "27 MB in git history" | **Wrong.** Never committed on any branch. It is untracked-and-unignored local scratch — which makes it the *only* copy, since git holds none. |

One new item was found that static analysis could not see: **D6**, `back/dist/` and
`back/tmp/` are untracked *and* unignored.

---

# A. Dead code in `src/`

## A1. `route.file.maxSize` / `allowedMimes` — the known issue, confirmed

**What it is.** `PostWithFileRoute` (`src/libs/routes/types.ts:93-96`) requires a
`file: { maxSize: number; allowedMimes: string[] }` block. Two routes supply it:
`src/libs/routes/clipboard/addEntry.ts:60-63` and
`src/libs/routes/reactor/addEntry.ts:48-51`, both `{ maxSize: 200, allowedMimes: ['image'] }`.
The test fixture app supplies a third (`tests/helpers/app/index.ts:187-190`).

**Usage.** Zero reads. `isPostWithFileRoute` (`types.ts:99`) only checks `'file' in route` —
it never touches the members. The three consumers of that predicate (`src/app.ts:81`,
`src/libs/middleware/apiPipeline.middleware.ts:33`, `scripts/generateSDK.ts:58`) all use it
as a boolean. Actual enforcement is global and hardcoded in
`src/libs/middleware/multipart.middleware.ts:14-16` (`fileSize: 5 * 1024 * 1024`), with the
mime filter commented out at lines 17-26.

**History — born dead 2026-05-19 (~3.5 months).** Introduced by **c6ea6cc5** (2026-05-19,
*"multipart - Create PostWithFileRoute type and use multipart middleware only on these
routes"*). The diff shows the `file` block and the type-guard were written together, and the
guard has always been `'file' in route` — the members existed solely to give the guard
something to detect. A pickaxe for any reading pattern (`file.maxSize`,
`allowedMimes.includes`) returns **no commit in the entire history**: these fields have never
been read.

The intent is stated outright in the follow-up commit **819a5e39** (2026-05-20): *"Framework
tests cover global behavior; route tests cover **future** per-route limit customization."*
Confirmed by that commit's tests, which assert the global 5 MB limit
(`Buffer.alloc(5 * 1024 * 1024 + 1)` → 400), not the declared `maxSize: 200`.

Worth flagging: the declared values are actively misleading. `maxSize: 200` reads as 200
bytes against a real limit of 5 MB (a 25,000x discrepancy), and `allowedMimes: ['image']`
isn't a valid MIME type in any form — it would never have matched `image/png` under a naive
`includes` check.

**Risk of removing: very low, now evidenced.** No test asserts on either field's value
(819a5e39's tests target the global limit), so removal cannot break the suite. Delete the
`file` block from `types.ts:93-96` and the three call sites. `isPostWithFileRoute` still
works via `'file' in route` — *except* that removing the property entirely makes the
predicate always false. The type must keep a discriminator: either narrow to `file: true` /
`hasFile: true`, or switch the predicate to a different signal. That is the one
non-mechanical part of this change. `npm run generate:sdk` output is unaffected (`hasFile`
is a boolean either way).

## A2. `validateAPIKey` middleware — an auth mode that lost its only route

> **Corrected.** Revision 1 called this "never adopted". It was adopted, then orphaned.

**What it is.** `src/libs/middleware/authAPIKey.middleware.ts` (73 lines): a generic `Bearer`-
token middleware validating against any row in the `ApiKeys` table, plus three `AppError`
subclasses.

**Usage.** No route sets `authentication: 'apikey'` today. The middleware is imported and
wired into the pipeline at `src/app.ts:14` and `src/app.ts:87-88`, but that branch is
unreachable. No test covers it (`tests/framework/auth.test.ts` covers `none` and
`apikey-iot` only).

**History — created 2026-04-12, orphaned 2026-06-04 (~3 months).**

- **891db6c8** (2026-04-12, *"AuthAPIKey - Create middleware"*) created it, added `'apikey'`
  to the auth union, and — crucially — **migrated a real route onto it**:
  `src/libs/routes/webStats/record.ts` went `'apikey-iot'` → `'apikey'` in the same commit.
  So the mode shipped with a genuine production user.
- **f6e7bcc9** (2026-06-04, *"SDK - enable keepalive fetch option"*) changed that same route
  to `authentication: 'none'`, leaving the mode with zero users.

The orphaning was a **side effect of an unrelated change**, which is why nothing flagged it.
That commit moved web-stats recording into the browser (`front/src/lib/WebStats/index.ts`,
`front/src/routes/(apps)/+layout.svelte`, plus SDK keepalive support). Dropping to `'none'`
was correct — a browser client cannot hold a secret API key — but it silently retired the
whole auth mode along with the route's authentication.

**Risk of removing: low, but this is a real extension point with a track record.** Unlike
revision 1's framing, this mode *worked* and *was used*; it lost its route for a specific,
sound reason. Removing the file means deleting the three error classes, which must first
move back into `authIOT.middleware.ts` (their only real consumer — see A3). `'apikey'` must
also come out of the auth union at `types.ts:72` and `AUTH_ERRORS` in
`scripts/generateSDK.ts:70-76`. The judgment call — keep it for the next server-to-server
client, or delete it — is the author's. If kept, it needs a test; nothing would currently
catch it breaking.

## A3. Backwards-compatibility re-export shim in `authIOT.middleware.ts`

**What it is.** `src/libs/middleware/authIOT.middleware.ts:26-38` — a 13-line
import-and-re-export block, commented *"Import and re-export error classes so existing
consumers are not broken."*

**History — born dead 2026-04-12 (~4.5 months), now proven.** Added by **891db6c8**, the same
commit that moved the error classes from `authIOT` into `authAPIKey`. Reading that commit's
tree, `errors.middleware.ts` — the only consumer at the time — already imports
`ApiKeyError` from `'./authAPIKey.middleware.js'`, **not** from `authIOT`. The commit
updated its one consumer *and* added a compatibility shim for consumers that no longer
existed. (The `ApiKeyError` branch was later dropped from the middleware entirely by
**86f346ac**, 2026-05-04.)

**Usage.** Every reference to `ApiKeyError`, `MissingApiKeyError`, `InvalidAuthHeaderError`
and `UnknownApiKeyError` is either the definition in `authAPIKey.middleware.ts` or
`authIOT`'s own internal use at lines 64/69/73 — which is served by the plain `import` at
lines 27-32, not by the `export` at lines 33-38.

**Risk of removing: none.** Drop lines 33-38, keep the import. Nothing outside the file can
observe the change.

## A4. `getPossibleMoves` — unreferenced Gravitrips helper

**What it is.** `src/libs/modules/gravitrips/board.ts:38-46`, returning the list of non-full
columns.

**Usage.** Zero references anywhere — not in `board.ts`, not in `Game.ts`, not in tests.

**History — born dead 2025-09-20 (~11 months).** Its entire history is a single commit:
**f35d24f4** (*"Gravitrip - Create WebSocket server and basic Gravitrip game"*). It was
written in the initial Gravitrips implementation alongside the rest of the board logic and
has never been touched or called since — supporting the reading that it was scaffolding for
a computer opponent (a legal-move generator is the standard entry point for one). Gravitrips
shipped human-vs-human over WebSocket, so it never got a caller.

**Risk of removing: none.**

## A5. `src/tools/openapi/generate_openapi_definition.ts` — duplicate of the live generator

> **Corrected.** Revision 1 said the module version came later and superseded the tool. Both
> were created in the same commit.

**What it is.** A 74-line standalone OpenAPI generator writing to
`./src/views/openapi_json.mustache`. It is a near-exact copy of
`src/libs/modules/openapi/index.ts` (81 lines) — the only differences are import paths, the
wrapping of the body in `generateDefinition(routes)`, and the added `initOpenapi` export
with an `slog` call. Both write the same output file.

**Usage.** Nothing imports it; no npm script runs it; no shell script invokes it.

**History — born redundant 2025-11-13 (~9.5 months).** **80b282ff** (*"Openapi - Add endpoint
serving the definition"*) created **both files in one commit**: `src/libs/modules/openai/index.ts`
(+81, note the `openai` typo) and `src/tools/openapi/generate_openapi_definition.ts` (+74).
The module was wired into `src/app.ts`; the tool never was. A pickaxe over `package.json`,
`src/tools/release/` and the `Dockerfile` for `generate_openapi` returns nothing — it has
never been invoked by any script. The module was later renamed `openai` → `openapi` by
**27e1f633** (2026-01-05, *"OpenAPI - Fix typo in module name"*), which is why its file log
looks short.

So this is not an evolution that left a stale copy behind; the author wrote the generator
twice in one sitting and only wired up one. Meanwhile `CLAUDE.md:453` and
`REPO_OVERVIEW.md:268` both point readers at the dead copy as *the* generator.

**Risk of removing: low.** The only loss is regenerating the definition without booting the
app — which nothing does, since it has never been in `package.json`. Update both doc
references to `src/libs/modules/openapi/index.ts` in the same change.

## A6. `src/packages/config/errors.ts` — unused `ConfigError`

**What it is.** A 5-line `ConfigError extends Error` carrying a `service` name.

**Usage.** Never imported, never thrown.

**History — orphaned 2024-11-16 (~21 months), the oldest live item in this audit.** Added by
**f4d930c4** (2024-05-27, *"Framework - Improve logging and error throwing when environment
variables are not defined"*) and used across the config sources for about six months. Killed
by **a0a2b432** (2024-11-16, *"Config - Move all properties in an object and validate the
object with a JSON schema"*), which deleted every throw site at once:

```
-import { ConfigError } from '../errors.js';      (x5 source files)
-    const configError = new ConfigError('db');
-    const configError = new ConfigError('db url invalid');
-    throw new ConfigError('ELK logger');
-    throw new ConfigError('ELK api');
-    const configError = new ConfigError('R2');
-    const configError = new ConfigError('slack');
-    throw new ConfigError('MeteoFrance API key');
```

The `service` field only made sense under the old per-source "which service is missing its
env var" model; whole-object schema validation replaced it. Exactly as revision 1 inferred,
now dated. The class file was simply not deleted with its callers. **The same commit also
orphaned B3** — see below.

**Risk of removing: none.**

## A7. `src/libs/modules/monitoring/index.ts` — bypassed barrel

**What it is.** A one-line barrel: `export * from './getRemoteTime.js';`.

**History — born bypassed 2025-07-29 (~13 months).** Created in **8c3faebc** (*"GetRemoteTime
- Update code to get time from DB"*). That commit's own route file imports the concrete
module — `import { getNowSec } from '../../modules/monitoring/getRemoteTime.js';` — and a
pickaxe for `modules/monitoring/index.js` across all history returns **nothing**. The barrel
has never been imported by anything, at any point.

**Risk of removing: none** — though the more consistent fix is the opposite one: point
`src/libs/routes/health/getRemoteTime.ts:3` at the barrel, matching every other module in
`src/libs/modules/`.

## A8. `src/libs/databases/data/logs-api-statox-index-template.ts` — unused ELK template

**What it is.** An Elasticsearch index template for the `logs-api-statox*` data stream, ~1.5 KB.

**Usage.** Never imported. Its two siblings *are* — `data-home-tracker-index-template.ts` and
`logs-meteo-france-index-template.ts` are both pulled into `src/libs/databases/elk.ts:4-5`.

**History — born dead 2024-10-01 (~23 months), the longest-dead item here.** Single commit:
**696fc55a** (*"ELK - Use data files to hold index templates"*), which extracted templates
out of `elk.ts` into data files:

```
back/src/libs/databases/data/data-home-tracker-index-template.ts  | 40 ++++
back/src/libs/databases/data/logs-api-statox-index-template.ts    | 63 +++++
back/src/libs/databases/elk.ts                                    | 30 +----
```

Only the home-tracker template was wired back in. A pickaxe for
`logs_api_statox_indexTemplate` returns just this one commit, so the symbol has never been
referenced. This is consistent with its header comment — *"in case I need to recreate it at
one point"* — i.e. it was extracted as documentation, not as a dependency.

**Risk of removing: low, but it is deliberate disaster-recovery documentation.** If the prod
`logs-api-statox` data stream were lost, this file is the recorded mapping. It is admittedly
incomplete (per its own TODO), so its recovery value is partial. Recommendation: keep and
relocate under a docs path, or add a knip ignore, rather than delete — but deleting is
defensible if the author judges the mapping stale.

---

# B. Dead declarations (types, config, enums)

## B1. `config.timeouts.headersTimeout` — a copy-paste slip, precisely dated

**What it is.** `HEADERS_TIMEOUT = 10 * 1000` (`src/packages/config/sources/timeouts.ts:1`) →
`parseConfig.ts:49` → required by the config JSON schema (`schema.ts:149,156`).

**Usage.** Never read. `src/app.ts:149` sets
`server.headersTimeout = config.timeouts.requestTimeout` — the *request* timeout — while the
comment directly above correctly describes `headersTimeout`'s distinct purpose.

**History — introduced 2025-08-03 (~13 months), and it is a regression.** `git log -G` on
`app.ts` gives the full two-commit story:

```
COMMIT 12083c39  2024-07-29  Server - Configure timeout (hoping to fix some homeTracker issues)
+    server.headersTimeout = 2000; // (default 60000)

COMMIT 9c164784  2025-08-03  Config - Add timeout session
-    server.headersTimeout = 2000; // (default 60000)
+    server.headersTimeout = config.timeouts.requestTimeout; // (default 60000)
```

**9c164784** moved three hardcoded timeouts into config — adding `HEADERS_TIMEOUT` to
`sources/timeouts.ts`, `parseConfig.ts` and `schema.ts` — then wired the wrong one into
`app.ts`. A single-token copy-paste slip in a 6-line edit to that file.

The effect is now quantifiable. Values are `HEADERS_TIMEOUT = 10s`, `REQUEST_TIMEOUT = 20s`:

- Before 2025-08-03: header timeout **2 s** (hardcoded).
- After: header timeout **20 s** (`requestTimeout`) — a 10x loosening.
- Intended: **10 s** — never applied, on any deploy, in 13 months.

So this is not merely a dead config entry; it silently relaxed a slow-loris guard by 10x,
and the config schema's `required` list makes the unused value look validated at startup.

**Risk: this is a bug, and removal is the wrong fix.** The correct change is
`server.headersTimeout = config.timeouts.headersTimeout`, which revives the dead entry and
tightens the timeout 20 s → 10 s. That is a real behaviour change and should be deliberate —
flagged, not silently applied. If the current 20 s is genuinely wanted, then delete the
source, the `parseConfig` entry and the schema property together. Leaving it half-wired is
the worst of the three options.

## B2. Unused `LoggableProperties` members

`src/libs/modules/logging/types.ts` — six properties with zero uses in `src/` or `tests/`,
each now dated:

| Property | Line | Orphaned | Commit |
|---|---|---|---|
| `authError?: Error` | 21 | **Born dead 2025-11-11** | 3bdb37d9 *Auth2 - Improve logging and response instrumenting* |
| `eventType?: string` | 50 | 2025-12-27 | 2cfdf9fe / e1181282 *PersonalTracker encryption* |
| `eventValue?: number` | 51 | 2025-12-27 | 2cfdf9fe / e1181282 *PersonalTracker encryption* |
| `eventDataStr?: string` | 52 | 2025-12-27 (added 2025-12-04) | e1181282 *PersonalTracker encryption* |
| `nbChords?: number` | 70 | **2026-08-21 (10 days ago)** | d88e45da *back: migrate chords module/routes to Chord table* |
| `timewindow?: string` | 104 | 2026-05-26 | a8953b34 *HomeTracker - TimeWindow - accept startDateMs/endDateMs* |

> **Corrected:** revision 1 said `authError` was "superseded by the generic `error` +
> `errorCode` pair". History disagrees. Its entire diff footprint across all commits is a
> single line — `+    authError?: Error;` — added by 3bdb37d9. No call site was ever
> written. It was declared in anticipation during an auth2 logging pass and never wired.

The PersonalTracker trio is confirmed as inferred: the 2025-12-27 encryption work
(`e1181282`, `2cfdf9fe`) turned `PersonalEvent` into
`{ eventDateUnix, saltB64, nonceB64, ciphertextB64 }`. Once entries became libsodium blobs,
the server could no longer see an event's type or value — logging them became impossible by
construction, not merely unused. `timewindow` was likewise superseded on 2026-05-26 by
`timewindowStartMs` / `timewindowEndMs`, both live.

Note for context: when the ReadingList feature was deleted (**42303535**, 2025-11-03), that
commit *did* remove its log property from `logging/types.ts`. So the author does prune this
type on feature removal — these six are genuine oversights, not accumulated policy.

**Risk of removing: none.** `LoggableProperties` is a closed allowlist consumed only by
`slog`/`LoggableContext`; unused optional members have no runtime presence. Historical
Elasticsearch documents keep their fields regardless.

## B3. Unused `AppLogComponent` member: `'env-helpers'`

`src/libs/modules/logging/types.ts:122`. No `slog.log('env-helpers', …)` call exists. For
contrast `'debug'` looks similarly unused but is live — `src/tools/elk/client-cli.ts:32`
uses it — so `'env-helpers'` is the only genuinely dead member of the union.

**History — orphaned 2024-11-16 (~21 months), by the same commit as A6.** **a0a2b432**
removed all four call sites in one go:

```
-    slog.log('env-helpers', 'Cant start app', { error: configError });   (x4)
```

The config JSON-schema refactor therefore left behind **both** `ConfigError` (A6) and this
union member — the same cleanup miss, in the same commit, on the same day. Worth treating
as one fix.

**Risk of removing: none in-process.** Caveat: Elasticsearch documents logged under this
component before 2024-11-16 may still exist in the `logs-api-statox` stream, so a saved
Kibana query filtering on it would stop matching anything new. That is already true today.

## B4. `'user'` auth mode — half-removed by the auth2 migration

`authentication: 'user'` survives in the union at `src/libs/routes/types.ts:72` and in
`AUTH_ERRORS` at `scripts/generateSDK.ts:71`. No production route uses it; the sole
occurrence is `tests/helpers/app/index.ts:115`, in the framework-test fixture app. Because
`src/app.ts:85-105` has no branch for `'user'`, that fixture route silently runs
**unauthenticated** — the name promises auth the pipeline never applies.

**History — orphaned 2025-11-03 (~10 months).** The auth2 migration ran module-by-module over
three days, and the pickaxe captures the whole sweep:

```
1be3792f  2025-11-01  Auth2 - Test helpers + migrate personnalTracker endpoints
fc4936df  2025-11-02  Auth2 - Migrate homeTracker routes
61eaf8c1  2025-11-02  Auth2 - Migrate clipboard routes
8285a71e  2025-11-02  Auth2 - Migrate webWatcher routes
a4ead79c  2025-11-02  Auth2 - Migrate chords routes
1bb72b6a  2025-11-02  Auth2 - Migrate reactor routes
812cb9af  2025-11-03  Auth2 - Migrate cookbook routes     <- last production route
```

The stale test fixture is considerably older: its `'user'` dates to **f1173a6c** (2024-05-27,
*"Auth - Enforce auth configuration in all routes and rename auth method to prepare api key
authentication"*), i.e. it predates auth2 by 18 months and was simply never revisited.

**Risk of removing: low.** Change the fixture at `tests/helpers/app/index.ts:115` to `'none'`
(which is what it already does at runtime, so no test behaviour changes), then drop `'user'`
from the union and from `AUTH_ERRORS`.

## B5. Error codes that can never reach a client

> **Corrected.** Revision 1 implied this gap arrived with the 2026-05-04 whitelist rewrite.
> It is roughly two years older.

`TOO_MANY_ENTRIES` and `ITEM_IS_EXPIRED` (`src/libs/errors/codes.ts:20-21`) back
`TooManyEntriesError` and `ExpiredItemError` in `src/libs/modules/s3files/errors.ts:9-19`.
Both are thrown live by `getPresignedURLForKey` (`s3files/index.ts:97,100`), reachable from
the clipboard and reactor read paths. Neither code appears in **any** route's `clientErrors`
array, and neither is in `ALWAYS_CLIENT_ERRORS` — so per the rule in `CLAUDE.md`, both are
treated as unexpected failures: generic `500 / INTERNAL_SERVER_ERROR` plus a Slack alert.

**History — a gap since the errors were created (~2 years).** The classes date to
**11981f24** (2024-02-21, *"Reactor: Proxy the presignedUrl with an endpoint"*) and
**195fe252** (2024-07-31, *"S3Files+Clipboard - Move presigned URL logic to S3File module"*).
Checking the middleware *as it stood before* the 2026-05-04 rewrite (`86f346ac^`), its 400
list was:

```
ItemAlreadyExistsError, FileOrContentRequiredError, EntryAlreadyExistsError,
ItemNotFoundError, DuplicateIngredientError, RecipeNotFoundError,
SensorDoesNotExistError, RangeTooLargeError, RangeInvalid, InvalidUrlError
```

`TooManyEntriesError` and `ExpiredItemError` are absent. They were already falling through
to 500 under the old middleware. The 2026-05-04 migration (**e199bbf2** added them to the
`ErrorCode` union, **10bfd66e** introduced `clientErrors`) faithfully carried the existing
behaviour forward — it did not introduce the gap, it inherited it.

So these are dead *declarations*: the specificity has been written, and discarded at the
boundary, for two years. (`FILE_TOO_LARGE` looks like the same problem but is not —
`errors.middleware.ts:44-46` emits it directly from the multer branch, before the whitelist
check.)

**Risk: this is a bug fix, not a removal.** Add both codes to `clientErrors` on the clipboard
and reactor routes that reach `getPresignedURLForKey`. Deleting them would be wrong — the
throw sites are live.

## B6. Vendored `suncalc`: only 1 of 6 exported functions is used

`src/packages/suncalc/` is a vendored, TypeScript-converted fork of `mourner/suncalc`. The
application imports exactly one function: `getTimes`, at
`src/libs/modules/ephemerides/services/sun.ts:2`.

`getPosition`, `getMoonPosition`, `getMoonIllumination`, `getMoonTimes` and `addTime` have
**no** callers outside the package's own tests. The moon features that would have used them
are served by `lunarphase-js` instead (`src/libs/modules/ephemerides/services/moon.ts:1`).
The exported types `SunTimes` and `MoonTimes` are likewise unreferenced outside the package.

Supporting cost is real: `src/packages/suncalc/tests/testcases.ts` is **19,573 lines** of
generated fixtures, and `migration.test.ts` exercises all five unused functions against them
on every `npm run tests:packages`.

**History — vendored wholesale 2024-11-07.** **bd789a30** (*"SunCalc - Import mourner's
library"*), followed by **3ddc804c** (2024-11-12, disabling the non-UTC `getMoonTimes` test
cases) and incidental churn from the ESM migration (**9bed8096**) and an eslint bump
(**5e5aa963**). The unused surface arrived complete with the import — it was never built up
incrementally in response to needs, which is exactly what one expects from a vendored fork.

**Risk of removing: low technically; recommendation is to leave it.** Trimming a vendored
library to its used surface makes upstream syncs painful and discards a validated migration
harness for no runtime gain (Node server, nothing tree-shaken). The honest framing is that
this is carrying cost, not that it should be deleted. If CI time is the concern — and
`AUDIT_CI_TIME.md` shows it has been — the `packages` suite is where that 19.5k-line fixture
is paid for.

---

# C. Dependencies

## C1. Removable — all five confirmed, now with orphaning dates

| Package | Where | Orphaned | Story |
|---|---|---|---|
| `libsodium` | dependencies | 2025-12-27 (~8 mo) | Added with `-wrappers` and `-sumo` by **d167b05a** (2025-12-14, *"WIP - Personal Tracker with encryption"*); all three moved to `dependencies` together by **c047d2ac** (2025-12-27, *"Libsodium - Move to dependencies to try to solve an import issue in prod"*). Only `-sumo` was ever imported. |
| `libsodium-wrappers` | dependencies | 2025-12-27 (~8 mo) | Same commits, same story. |
| `@smithy/util-stream` | devDependencies | **2025-01-27 (~19 mo)** | Genuinely used from **2064955b** (2024-01-31) until **af3b4f07** (2025-01-27, *"S3 - Simplify local setup using a buffer"*) removed its only import: `-import { sdkStreamMixin } from '@smithy/util-stream';` |
| `aws-sdk-client-mock-jest` | devDependencies | **2025-01-27 (~19 mo)** | Imported from 2024-01-31. The ESM migration commented it out with a TODO — `// import 'aws-sdk-client-mock-jest'; // TODO commented when trying to migrate to ESM, what is it used for?` — and **03f98e06** (2025-01-27) deleted the dead line. The author's own TODO already doubted it; the question was never resolved. |
| `@types/connect-sqlite3` | devDependencies | 2025-11-01 (~10 mo) | Added by **11885b92** (2025-10-24, *"WIP - passport auth - Working POC login + session + me endpoints"*) when the session store was SQLite; **17b8b997** (2025-11-01, *"Auth - Use MysqlStore for express-session store"*) swapped the store and dropped the runtime package but left the `@types`. |

The `libsodium` triple confirms the "installed every variant while figuring out which one
works" reading — c047d2ac's own message says *"to try to solve an import issue in prod"*,
i.e. all three were promoted as a shotgun fix, and the two spares stayed.

> **Corrected:** revision 1 described `@smithy/util-stream` and `aws-sdk-client-mock-jest` as
> having "zero references anywhere". Accurate for the current tree, but both had real import
> sites for about a year. The conclusion (remove) is unchanged; the reasoning was wrong.

**Risk of removing: low for all five.** `libsodium-wrappers-sumo` declares its own
dependencies, so removing the two siblings does not break it. Verify nothing elsewhere in
the monorepo hoists these from `back/`'s `package.json`, then run `npm run tests:all`.

## C2. `github-actions-ctrf` — RESOLVED, removable

> **Question closed.** Revision 1 could not see `.github/` and deferred this.

The root workflows are now visible. `.github/workflows/dependabot-auto-merge-back.yml:136`
uses the **GitHub Action** `ctrf-io/github-test-reporter@v1.1.1` — not the npm package. The
switch is dated: **96f39712** (2026-05-10, *"fix: replace npx github-actions-ctrf with
ctrf-io/github-test-reporter action"*):

```
-  run: npx github-actions-ctrf ctrf/ctrf-report.json
-  run: npx github-actions-ctrf pull-request ctrf/ctrf-report.json
+  uses: ctrf-io/github-test-reporter@v1
+      report-path: 'back/ctrf/ctrf-report.json'
```

The npm devDependency (added **f7f281ec**, 2025-01-05, *"CI - Add tests reports"*) was left
in `back/package.json`. **Orphaned 2026-05-10 (~3.5 months). Safe to remove** — it makes six
removable dependencies in total.

For completeness, these remain false positives of import analysis and must be kept: `ctrf`
and `mocha-ctrf-json-reporter` (used from `package.json` itself — `ci:merge-reports`,
`tests:ci`), and `oxfmt` / `oxlint` / `typescript` (CLI-only).

## C3. Not dead, but worth noting: a mock library in production dependencies

`aws-sdk-client-mock` sits in `dependencies`, not `devDependencies`, and that is currently
**correct** — it is imported unconditionally at the top of `src/libs/databases/s3.ts:9`, a
production module, so it must be present in the prod image. The `isTests` guard at line 14
gates only the `mockClient()` call, not the import.

Same pattern for fixture seeding: `src/libs/databases/db.ts:5` imports
`populateFakeChordsData`, and `src/libs/databases/elk.ts:3,6` import
`populateFakeHomeTrackerData` / `populateFakeMeteoFranceLogs` — so `src/tools/` ships to
production too.

Nothing to delete. If a leaner prod image is wanted, a dynamic `await import()` inside the
`isTests` branch would let all four move to `devDependencies`.

---

# D. Files and build artifacts

## D1. `back/tmp/` — 27 MB of completed-migration input, never committed

> **Corrected.** Revision 1 warned this was "27 MB in git history". It is not, and the
> correction cuts both ways.

**What it is.** 27 MB, dominated by `tmp/songbook-backup/data/` — hundreds of `.doc`/`.docx`
song files — plus conversion scripts, `index.json`, and a generated `update-chord-content.sql`.

**Usage.** No code reads it. It is the raw input to the chords S3→MySQL migration
(`superpowers/specs/2026-07-22-chords-db-migration-design.md`), which is complete: the
`Chord` table exists, `contentB64` is populated by the live extraction pipeline, and the
`songbook` bucket is gone from `src/libs/databases/s3.ts` (`requiredBuckets` is now just
`clipboard` and `reactor`).

**History — never tracked.** `git log --all -- back/tmp` returns **nothing**: it has never
been committed on any branch. So there is no repository bloat and no history rewrite to
consider — revision 1's main concern was unfounded.

**Risk of removing: low, but the backup caveat is now *stronger*.** Precisely because git
never tracked it, the repository holds **no copy at all**. These are the only copies of the
original documents anywhere in the project, and the migration produced base64 text in MySQL,
not the source files. Confirm an off-project backup exists, then delete freely — it is
ordinary local scratch, not a git problem.

## D2. `extract-chords.ts` and `test-suncalc.ts` — root-level POC scripts

**What they are.** `extract-chords.ts` (10 lines) is self-described as *"POC script ran
manually with `npx tsx extract-chords.ts`"*; it calls `updateChordsExtractedData()` once.
`test-suncalc.ts` (36 lines) prints an ASCII daylight chart for three years to stdout.

**Usage.** Neither is imported, run by an npm script, or covered by a test. Neither is
gitignored — note that `index-test.ts`, a sibling of the same kind, *is* in `.gitignore`, so
the author has ignored this class of file before.

**History.**
- `extract-chords.ts` — added **70a0d7b0** (2026-08-23, *"back: add chord content extraction
  module and DB schema"*), 8 days before this audit. Fresh scratch from in-flight work.
- `test-suncalc.ts` — added **1df68095** (2025-02-13, *"Short test of suncalc"*), 18 months
  ago, and since then touched only by **59a74e58** (2026-05-12, *"WIP - require-await eslint
  rule"*). That is pure carrying cost: a throwaway script surviving long enough to be
  maintained by an unrelated lint sweep.

The functionality behind both is live elsewhere: `updateChordsExtractedData` is exported from
the chords barrel, and `getSolarState` is covered by the ephemerides routes and tests.

**Risk of removing: none.** Given `extract-chords.ts` is 8 days old, confirm the chords
extraction work is finished before deleting it. Their other cost is compilation — see D4.

## D3. Orphaned Prettier configuration — three days old

**What it is.** `.prettierrc` and `.prettierignore` at `back/`.

**Usage.** Dead. `prettier` is not in `dependencies` or `devDependencies`, and no script or
hook invokes it. Formatting is `oxfmt`, configured in `.oxfmtrc.json`.

**History — orphaned 2026-08-28, three days before this audit.** The configs are original
furniture: `.prettierignore` from **7437305f** (2023-11-27, "Initial commit") and
`.prettierrc` from **159ddec4** (2023-11-28, *"Rework routes structure + add prettier and
(broken) eslint"*) — 33 months of service. The toolchain was then replaced across three
commits in two days:

```
bdd778df  2026-08-27  Tooling - Cleanup npm scripts
dbc81964  2026-08-27  Oxlint: replace ESLint/typescript-eslint with oxlint
1e325522  2026-08-28  Tooling - Replace prettier with oxfmt
```

**1e325522** added `.oxfmtrc.json` (+19), removed prettier from `package.json`, and updated
`REPO_OVERVIEW.md`, `deploy.sh` and the mocha configs — but its `--name-status` shows it
never touched `.prettierrc` or `.prettierignore`. A clean, thorough migration that missed
exactly two files. This is the freshest and most clear-cut item in the audit.

`.prettierignore` is doubly orphaned: its contents (`/build`, `/.svelte-kit`, `/package`,
`pnpm-lock.yaml`, `**/*.md.d.ts`) describe a SvelteKit frontend. Nothing in this Express
backend produces those paths.

**Risk of removing: very low.** Only consideration is editor integration — a developer with
format-on-save Prettier is currently getting `.prettierrc`'s rules silently; deleting it
drops them to Prettier defaults, which would fight `oxfmt`. Since `.oxfmtrc.json` was written
to reproduce the existing style, confirm the two agree, then delete both.

## D4. Build configuration ships tests to production

**What it is.** `tsconfig.json` declares `"rootDir": "."` with **no `include` or `exclude`**.
`npm run build` therefore compiles everything: `dist/` holds 269 `.js` files, of which **82
are compiled tests** under `dist/tests/`, plus `dist/extract-chords.js` and
`dist/test-suncalc.js` from D2.

Compounding it, the `Dockerfile` does `COPY . .` with **no `.dockerignore`** — so the build
context includes `tmp/` (27 MB), the existing `dist/`, `node_modules/`, `.venv/` and
`superpowers/` before `npm ci` runs.

**History — never configured otherwise.** A pickaxe for `exclude` on `back/tsconfig.json`
returns **no commit**: the config has never had an exclusion, so tests have been compiled
into `dist/` for the project's entire life. Likewise `git log --all -- back/.dockerignore`
is empty — one has never existed. (Root-level `.dockerignore` hits belong to the `gh-pages`
frontend deploy branch and are unrelated.)

This is not simple oversight: the suites *require* compiled output — every
`tests/mocha/*.json` points `spec` at `dist/tests/**/*.test.js`. Tests must be compiled; they
just need not be in the production image.

**Risk of changing: low, but not a one-liner.** Adding `exclude` to `tsconfig.json` breaks
`npm run tests` outright. The correct shape is a separate `tsconfig.build.json` (excluding
`tests/`, `scripts/`, and the D2 scripts) used by `npm run build`, leaving the default config
for `watch` and `types`. Adding `.dockerignore` is independent, safe, and worth doing alone —
it will meaningfully speed up `docker build`.

## D5. Local artifacts — already handled

`chords_check_results.json` (written by `src/libs/modules/chords/urlsChecker.ts:5`) and
`src/tools/tmp.sql` (assembled by `src/tools/init-db.sh:35-49`, never cleaned up) are present
in the working tree but **already in `back/.gitignore`** (confirmed via `git check-ignore`).
No action needed; noted so they aren't mistaken for orphans on a future pass.

## D6. `back/dist/` and `back/tmp/` are untracked *and* unignored — NEW

Found only via git; static analysis could not see it.

`git check-ignore -v back/dist back/tmp` matches **no rule**, and neither has ever been
committed. They are therefore permanently `??` in `git status` — which is exactly how they
appeared at the start of this audit:

```
?? back/dist/
?? back/tmp/
```

`back/.gitignore` covers `node_modules`, `ctrf`, `*.dev`, `.DS_Store`, the generated
`openapi_json.mustache`, `index-test.ts`, `chords_check_results.json`, `src/tools/tmp.sql`
and `.env.keys` — but not the primary build output directory.

Two costs: permanent status noise that trains the eye to ignore `??` entries, and the risk of
`git add -A` sweeping 4.1 MB of build output (or 27 MB of `tmp/`) into a commit. That has not
happened yet, but nothing prevents it.

**Risk of fixing: none.** Add `dist` and `tmp` to `back/.gitignore`. Nothing is tracked, so
no `git rm --cached` is needed.

---

# E. Minor items

- **`ChordNotFoundError` re-export** — `src/libs/modules/chords/index.ts:9` re-exports it, but
  all three consumers (`commands.ts:4`, `queries.ts:4`, and the module itself) import from
  `./errors.js` directly. Note that
  `superpowers/plans/2026-05-04-error-codes-rationalization.md:111` has an unchecked step to
  remove exactly this kind of re-export from `webWatcher/index.ts` — so this cleanup is
  already on the author's list, just unfinished.
- **`InvalidUrlError` re-export** — `src/libs/modules/webReader/index.ts:2`, same pattern, no
  external consumer.
- **`OutputValidationError`** (`src/libs/middleware/apiPipeline.middleware.ts:11`) and
  **`connectionHandler`** (`src/libs/routes/gravitrips/ws_game.ts:6`) are `export`ed but used
  only within their own file. Drop the keyword.
- **`board.ts` over-exporting** — `nbColumns`, `nbRows`, `targetAlign`, `InvalidMoveError`,
  `isValidMove`, `boardIsFull`, `checkWinner` are used internally but exported with no
  external consumer. (`BoardState`, `getNewBoard`, `getBoardState`, `getWinningCells`,
  `makeMove` are genuinely external.)
- **`th.mysql.dumpTables` / `th.elk.dumpIndex`** have no callers, but both are documented in
  `CLAUDE.md` as debugging affordances. **Keep** — intentionally-unused debug tooling is not
  dead code.
- **Stale plan docs** — `superpowers/plans/2026-04-26-youtube-google-auth.md` and
  `2026-04-27-yt-helper-frontend-migration.md` describe a YouTube/Google-auth feature. A
  case-insensitive search for `youtube|google` across `src/`, `tests/`, `scripts/`, the SQL
  tables and `.env` returns **nothing** — the feature was never built. Both plans predate the
  auth2 migration.
- **Doc drift** — beyond the `CLAUDE.md:453` / `REPO_OVERVIEW.md:268` OpenAPI pointers (A5),
  `CLAUDE.md`'s test-helper section omits `th.fetch` and `th.crypto`, both registered in
  `tests/helpers/index.ts`.

---

# Summary

Ordered by value-to-risk. Ages are relative to 2026-08-31.

**Remove now — zero or near-zero risk (10 items).**
D3 Prettier config *(orphaned 3 days ago — freshest and most clear-cut)* ·
D6 gitignore `dist`/`tmp` *(new; one-line fix)* ·
A3 re-export shim *(born dead, 4.5 mo)* · A4 `getPossibleMoves` *(born dead, 11 mo)* ·
A6 `ConfigError` + B3 `'env-helpers'` *(same commit, 21 mo — fix together)* ·
A7 monitoring barrel *(born bypassed, 13 mo)* · B2 six log properties ·
C1 five dependencies · C2 `github-actions-ctrf` *(now confirmed removable)* ·
D2 two POC scripts *(check `extract-chords.ts` isn't still in use — it's 8 days old)*.

**Remove with a small refactor (4).**
A1 the `file` block *(needs a replacement discriminator — the only fiddly part; no test
asserts the dead values)* · A2 `validateAPIKey` *(product decision: it worked and was used
until 2026-06-04, so this is "retire a proven extension point", not "delete dead weight")* ·
A5 duplicate OpenAPI generator *(update two doc references)* · B4 `'user'` auth mode.

**Fix rather than remove (2).**
**B1 `headersTimeout` — promote to the top of this group.** History reclassifies it from
"dead config" to a live 13-month regression: a copy-paste slip in 9c164784 loosened the
header timeout from 2 s to 20 s while the intended 10 s was never applied. One-token fix,
but a real behaviour change — decide deliberately.
B5 `TOO_MANY_ENTRIES` / `ITEM_IS_EXPIRED` — add to the relevant routes' `clientErrors`. Older
than first thought (~2 years, predating the whitelist rewrite); throw sites are live and
currently produce silent 500s plus Slack noise.

**Decide deliberately (3).**
A8 ELK template *(born dead 2024-10-01 — longest-dead item, but deliberate disaster-recovery
documentation; recommend keep and relocate)* · B6 vendored suncalc *(imported wholesale
2024-11-07; recommend keep — trimming a vendored fork costs more than it saves)* ·
D1 `tmp/` 27 MB *(never committed, so no history concern — but for that same reason git holds
no copy; confirm an off-project backup first)*.

**Separate, larger win (1).**
D4 — a `.dockerignore` plus a build-only tsconfig would stop 82 compiled test files and a
27 MB build context reaching the production image. Neither has ever existed in this project.
The `.dockerignore` half is safe and independent; do it first.

**Open questions: none.** Both items deferred in revision 1 (C2 `github-actions-ctrf`, D1
`tmp/` tracking status) are resolved above.
