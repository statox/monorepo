# api.statox.fr Backend Overview

Personal TypeScript/Express API serving several small hobby features (HomeTracker IoT dashboard, Chords, Clipboard, Cookbook, WebWatcher, Gravitrips, PersonalTracker, Reactor, WebReader, WebStats, Ephemerides) behind one Express app. It lives at [`back/`](.) inside a monorepo whose sibling [`front/`](../front) app and [`packages/sdk`](../packages/sdk) consume a generated SDK from this API.

## Stack & Tooling

- **Language**: TypeScript, Node 24.x ([`package.json`](package.json) `engines.node`), ES modules (`"type": "module"`, all imports use `.js` extensions).
- **Framework**: Express 5, plus a `ws` WebSocket server on the same HTTP port.
- **Package manager**: npm, lockfile [`package-lock.json`](package-lock.json).
- **Key dependencies**: `mysql2`, `@elastic/elasticsearch`, `@aws-sdk/client-s3`, `passport`/`passport-local`, `ajv` + `express-json-validator-middleware`, `luxon`, `@dotenvx/dotenvx`, `@slack/webhook`, `mustache-express`.
- **Dev tooling**: oxlint ([`.oxlintrc.json`](.oxlintrc.json)), oxfmt ([`.oxfmtrc.json`](.oxfmtrc.json)), `tsc` for compilation ([`tsconfig.json`](tsconfig.json), target es2022, strict mode).
- **Test tooling**: Mocha + Chai + Supertest + Sinon.
- **CI**: GitHub Actions at [`.github/workflows/dependabot-auto-merge-back.yml`](../.github/workflows/dependabot-auto-merge-back.yml) - runs lint, oxfmt format check, and tests on dependabot PRs touching `back/**`, then auto-approves/merges if green. This workflow is also used for human-authored PRs skipping the dependabot auto approval step
- **Runtime/deploy target**: containerized. Built and deployed via Docker Compose to a self-hosted VPS (see [Build Process](#build-process)).

## Architecture

A request enters through [`index.ts`](index.ts), which boots MySQL, Elasticsearch, S3/LocalStack, then calls `initApp()` in [`src/app.ts`](src/app.ts). `app.ts` builds a per-route middleware pipeline and registers all routes from a static list.

```
logging → [multipart, if file route] → [auth: apikey-iot | apikey | user2 session] → [JSON schema validation, POST only] → apiPipeline(route handler) → errorHandler
```

| Directory | Purpose |
|---|---|
| [`src/libs/routes/`](src/libs/routes) | Thin, strongly-typed route definitions, one folder per feature, one file per endpoint. |
| [`src/libs/middleware/`](src/libs/middleware) | Express middleware: logging, auth (IoT key, API key, PassportJS session), file upload, schema validation, error handling. |
| [`src/libs/modules/`](src/libs/modules) | Business logic per feature, called from routes. |
| [`src/libs/databases/`](src/libs/databases) | MySQL, Elasticsearch, and S3 client/connection setup. |
| [`src/libs/errors/`](src/libs/errors) | `AppError` base class and the error-code whitelist system. |
| [`src/libs/PeriodicTasks/`](src/libs/PeriodicTasks) | Background jobs, started only in production. |
| [`src/packages/config/`](src/packages/config) | Reads and validates environment variables into a typed `config` object. |
| [`src/packages/suncalc/`](src/packages/suncalc) | Reusable sun-position calculation package, used by `ephemerides`. |
| [`src/tools/`](src/tools) | CLI utilities: DB table init, user creation, ELK setup, OpenAPI generation, production deploy script. |
| [`src/views/`](src/views) | Mustache templates for a couple of server-rendered pages. |
| [`tests/`](tests) | Mocha test suites mirroring `src/`, plus a custom test-helper framework. |

Entry points: [`index.ts`](index.ts) (process boot, service init, graceful shutdown on `SIGTERM`/`SIGINT`/uncaught exceptions), [`src/app.ts`](src/app.ts) (Express app + route/middleware wiring), [`src/app-ws.ts`](src/app-ws.ts) (WebSocket routing for `routesWS.list`, e.g. the Gravitrips game).

Build/compile detail is covered in [Build Process](#build-process), not here.

## Build Process

- **Build tooling**: plain `tsc`, no bundler. Config in [`tsconfig.json`](tsconfig.json), output to `dist/`.
- **For tests**: Mocha configs under [`tests/mocha/`](tests/mocha) point at compiled files in `dist/tests/...`, not `src/` directly. No test script itself runs `tsc` - compilation must happen first via `npm run build`, `npm run watch` (watch mode for dev), or the `postinstall` hook (`tsc`, runs automatically after `npm install`).
- **For production**: `npm run build` (`rm -fr dist/ && tsc`) produces the compiled server in `dist/`. The [`Dockerfile`](Dockerfile) packages this into a container image. Deployment is driven by [`src/tools/release/deploy.sh`](src/tools/release/deploy.sh) (invoked via `npm run prod:deploy`): builds and lints locally, optionally runs tests, SSHes into the production VPS (`panda.statox.fr`), does `git fetch` + `git reset --hard` on the monorepo there, then `docker compose down` / `docker compose up --build api -d` using [`src/tools/docker-compose.prod.yml`](src/tools/docker-compose.prod.yml), and polls the `/health/getRemoteTime` endpoint to confirm success.
    - **Note**: [`DEV.md`](DEV.md)'s "Monorepo" section describes an older deploy mechanism (`git subtree` + force-push to a Heroku remote, `heroku:deploy` npm scripts). That mechanism no longer exists in [`package.json`](package.json) - deployment has moved to the SSH/Docker Compose flow described above. Treat the `DEV.md` subtree instructions as historical, not current.

## Features

- **Auth** - Session-based login for the "user2" auth mode via PassportJS.
    - Endpoints: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.
    - Files: [`src/libs/routes/auth/`](src/libs/routes/auth), [`src/libs/modules/auth/`](src/libs/modules/auth), [`src/libs/middleware/auth_passport.middleware.ts`](src/libs/middleware/auth_passport.middleware.ts).
    - Small, stable.

- **HomeTracker** - IoT sensor data ingestion and dashboard: histogram views, pressure history, sleep/boost sensor control, weather forecast overlay. Backed by Elasticsearch for sensor time series plus MySQL for metadata.
    - Endpoints: `enableSensorBoost`, `getSensorsDataForDashboard`, `getWeatherForecast`, `histogramData`, `updateSensorMetadata`, `upload` under `src/libs/routes/homeTracker/`.
    - Files: [`src/libs/routes/homeTracker/`](src/libs/routes/homeTracker), [`src/libs/modules/homeTracker/`](src/libs/modules/homeTracker) (largest module in the repo, ~1160 lines across a `services/` subfolder).
    - Largest, most actively developed feature - most recent commits target this area.

- **Chords** - Stores and serves music chord-sheet links, with link-visit tracking and periodic dead-link checking.
    - Endpoints: `addLinkVisit`, `checkLinks`, `getAll`, `getLinksVisitsCount`, `updateAll`.
    - Files: [`src/libs/routes/chords/`](src/libs/routes/chords), [`src/libs/modules/chords/`](src/libs/modules/chords).
    - Medium size; `updateAll` has a bumped 500kb JSON body limit noted in [`src/app.ts`](src/app.ts).

- **Clipboard** - Small cross-device text/file clipboard with public and private entries.
    - Endpoints: `addEntry`, `deleteEntry`, `getAllEntries`, `getPublicEntries`, `staticView` (server-rendered Mustache view).
    - Files: [`src/libs/routes/clipboard/`](src/libs/routes/clipboard), [`src/libs/modules/clipboard/`](src/libs/modules/clipboard).
    - Logic overlaps with Reactor - see [Patterns](#patterns).

- **Cookbook** - Recipe and ingredient storage.
    - Endpoints: `addRecipe`, `getRecipe`, `listIngredients`, `listRecipes`.
    - Files: [`src/libs/routes/cookbook/`](src/libs/routes/cookbook), [`src/libs/modules/cookbook/`](src/libs/modules/cookbook).
    - Small, stable CRUD feature.

- **Ephemerides** - Sun/moon rise-set and phase data for a given date/range.
    - Endpoints: `getRange`, `getToday`.
    - Files: [`src/libs/routes/ephemerides/`](src/libs/routes/ephemerides), [`src/libs/modules/ephemerides/`](src/libs/modules/ephemerides), backed by the standalone [`src/packages/suncalc/`](src/packages/suncalc) package.
    - Small, self-contained.

- **Gravitrips** - A Connect-Four-style game played over WebSocket.
    - Endpoints: `getNewGame` (HTTP), `ws_game` (WebSocket, registered in `routesWS.list`).
    - Files: [`src/libs/routes/gravitrips/`](src/libs/routes/gravitrips), [`src/libs/modules/gravitrips/`](src/libs/modules/gravitrips) (`Game.ts`, `board.ts`, `gameService.ts` - the densest logic-per-file module in the repo).
    - Medium/complex; the only WebSocket-driven feature.

- **PersonalTracker** - Personal daily log/tracking entries, with periodic reminder notifications.
    - Endpoints: `getAll`, `upload`.
    - Files: [`src/libs/routes/personalTracker/`](src/libs/routes/personalTracker), [`src/libs/modules/personalTracker/`](src/libs/modules/personalTracker), periodic reminder in [`src/libs/PeriodicTasks/`](src/libs/PeriodicTasks).
    - Small.

- **Reactor** - Tagged image/file entries stored in S3, with a public listing endpoint.
    - Endpoints: `addEntry`, `getEntriesForPublic`, `getEntry`.
    - Files: [`src/libs/routes/reactor/`](src/libs/routes/reactor), [`src/libs/modules/reactor/`](src/libs/modules/reactor).
    - Logic overlaps with Clipboard - see [Patterns](#patterns).

- **WebReader** - Fetches and returns a web page's title for a given URL.
    - Endpoints: `getPageTitle`.
    - Files: [`src/libs/routes/webReader/`](src/libs/routes/webReader), [`src/libs/modules/webReader/`](src/libs/modules/webReader).
    - Tiny, single-purpose.

- **WebStats** - Records simple usage/event stats.
    - Endpoints: `record`.
    - Files: [`src/libs/routes/webStats/`](src/libs/routes/webStats), [`src/libs/modules/webStats/`](src/libs/modules/webStats) (19 lines - smallest module in the repo).
    - Minimal.

- **WebWatcher** - Periodically checks watched web pages for content changes and notifies the user.
    - Endpoints: `createWatcher`, `deleteWatcher`, `getAllWatchers`, `toggleWatcherEnabled`.
    - Files: [`src/libs/routes/webWatcher/`](src/libs/routes/webWatcher), [`src/libs/modules/webWatcher/`](src/libs/modules/webWatcher), periodic check task in [`src/libs/PeriodicTasks/`](src/libs/PeriodicTasks).
    - Medium; uses both Slack and push notifications on change detection.

- **Health & OpenAPI** - Infrastructure endpoints, not user features: `GET /health/getRemoteTime` (used by the deploy script's health check) and `GET /openapi/definition` (serves the auto-generated OpenAPI spec).
    - Files: [`src/libs/routes/health/`](src/libs/routes/health), [`src/libs/routes/openapi/`](src/libs/routes/openapi), generator at [`src/tools/openapi/generate_openapi_definition.ts`](src/tools/openapi/generate_openapi_definition.ts).

## Setup

From [`README.md`](README.md):

```bash
# At clone time
npm install
npm run setup-githooks   # post-merge hook alerting on merged dependabot PRs

# Working locally (each in its own terminal)
npm run env               # start docker environment: MySQL, LocalStack S3, Elasticsearch
./src/tools/init-db.sh    # create MySQL tables from src/tools/tables/*.sql
npm run watch             # TypeScript watcher, recompiles to dist/
npm run serve             # start the server on port 3000, TZ=UTC, watches dist/index.js
```

Required services, per [`src/tools/docker-compose.yml`](src/tools/docker-compose.yml): MySQL 8.0.33, LocalStack (S3 emulation), Elasticsearch 8.15.2. All three are started by `npm run env`.

Secrets are managed with [dotenvx](https://dotenvx.com/): values live encrypted in [`.env`](.env), decrypted at runtime using the private key in `.env.keys` (gitignored, not committed - see [`DEV.md`](DEV.md) "Secrets and Environment Variables"). Config is read from environment variables by [`src/packages/config/sources/`](src/packages/config/sources) (one file per service) and assembled/validated against a JSON schema in [`src/packages/config/services/parseConfig.ts`](src/packages/config/services/parseConfig.ts) - the app refuses to start if config validation fails.

The app requires the host process to run in the UTC timezone; [`src/app.ts`](src/app.ts) checks this at startup and exits if not.

## Tests

Framework: Mocha + Chai + Supertest + Sinon, four suites each with their own config in [`tests/mocha/`](tests/mocha):

```bash
npm run tests              # route integration tests (needs test DB: src/tools/init-db.sh --tests)
npm run tests:framework    # middleware/infra-level tests
npm run tests:packages     # package unit tests (e.g. suncalc, config)
npm run tests:scripts      # tests for src/tools scripts (e.g. SDK generation)
npm run tests:all          # all of the above
```

Run a single test: `npm run tests -- -f 'personalTracker/getAll'`. Add `debug=true` before the command for verbose logs.

Tests run against **compiled JS in `dist/tests/...`**, not `src/` directly - a `tsc` build (`npm run build`, `npm run watch`, or the `postinstall` hook) must happen first; no test script triggers compilation itself.

A custom helper framework in [`tests/helpers/`](tests/helpers) exposes a `th` object aggregating helpers for MySQL fixtures/assertions, PassportJS session auth, S3 call assertions, Elasticsearch fixtures, `slog` log assertions, fake-clock time control, and Slack/push notification assertions. Each helper extends [`tests/helpers/TestHelper.ts`](tests/helpers/TestHelper.ts) with `beforeEach`/`afterEach` hooks; execution order is fixed in [`tests/helpers/mocha/routesMochaWrapper.ts`](tests/helpers/mocha/routesMochaWrapper.ts) (`mysql → auth → auth2 → slack → push → fetch → s3 → slog → elk`, MySQL first so table-clearing runs before anything else). Note: the `th` export in [`tests/helpers/index.ts`](tests/helpers/index.ts) omits the plain `auth` helper that the wrapper still runs - a minor divergence worth knowing about if a new helper is added.

**Coverage gap**: `src/libs/routes/auth/` has no `tests/routes/auth/` directory. Auth is exercised only indirectly, at the middleware level, via [`tests/framework/auth.test.ts`](tests/framework/auth.test.ts) and `auth2.test.ts` - not as route-level supertest tests like every other module has.

CI enforces lint + oxfmt format + tests on dependabot PRs (see [Stack & Tooling](#stack--tooling)); no coverage threshold is configured.

## Patterns

- **Route/module split**: routes in [`src/libs/routes/`](src/libs/routes) are deliberately thin - they wire up auth mode, JSON schema, and a handler that mostly just calls into a module and maps its errors. Business logic, database access, and external API calls live in [`src/libs/modules/`](src/libs/modules).
- **Module internal structure** is not fully standardized: larger modules (`homeTracker`, `cookbook`, `ephemerides`, `personalTracker`, `logging`, `webStats`) split into a `services/` subfolder with one function per file; smaller ones (`clipboard`, `reactor`) keep flat files. There's no documented rule for when a module should graduate to the nested form.
- **Errors**: a shared `AppError` base class ([`src/libs/errors/AppError.ts`](src/libs/errors/AppError.ts)) carries a `code` and `httpStatus`. Only 7 of 19 modules define their own `errors.ts` (`auth`, `clipboard`, `cookbook`, `homeTracker`, `reactor`, `s3files`, `webReader`) - the rest reuse generic errors or don't throw custom ones. Each route declares a `clientErrors: ErrorCode[]` whitelist; [`src/libs/middleware/errors.middleware.ts`](src/libs/middleware/errors.middleware.ts) forwards a thrown `AppError` to the client only if its code is in that whitelist or in `ALWAYS_CLIENT_ERRORS` - otherwise it's logged, alerted to Slack, and masked as a generic 500. Forgetting to whitelist a new error code is a common way to accidentally turn an intentional client error into a silent 500.
- **Logging**: a custom `slog` logger ([`src/libs/modules/logging/`](src/libs/modules/logging)) is strictly typed against `AppLogComponent` and `LoggableProperties` unions defined in [`src/libs/modules/logging/types.ts`](src/libs/modules/logging/types.ts), to avoid uncontrolled Elasticsearch field mappings. New log components/properties must be added to those types before use.
- **Notifications**: two independent channels in [`src/libs/modules/notifier/`](src/libs/modules/notifier) - Slack webhooks for errors/alerts, ntfy.sh push for user-facing mobile notifications. Both swallow their own failures so a failed notification never breaks the calling code path.
- **Config**: every environment variable is read once, in one place, in [`src/packages/config/sources/`](src/packages/config/sources), then validated as a whole against a strict AJV schema at startup - code elsewhere should read from the typed `config` object, never `process.env` directly.
- **Duplication to note**: `Clipboard` and `Reactor` independently implement very similar "entry with optional file, stored in S3 plus MySQL metadata" logic, without a shared abstraction. `s3files` provides a generic S3 helper, but `chords`, `reactor`, and `clipboard` each also have S3 code that doesn't consistently reuse it.

## Area Deep Dives

### Routes & Middleware

| | |
|---|---|
| Scope | HTTP/WebSocket route definitions and the Express middleware pipeline. Business logic and DB access are deliberately elsewhere, in `src/libs/modules/`. |
| Size / complexity | ~43 route files across 14 feature folders, plus 8 middleware files. Individually small and simple; the composition logic in [`src/app.ts`](src/app.ts) that assembles the per-route pipeline is the most complex part. |
| Quality | Consistent, well-typed, small files. |
| Activity | Actively developed - 20 recent commits touching this area, most recent 13 days ago (multipart/multer migration, auth scope fixes). |
| Concerns | Minor duplication: auth routes are listed separately from the main route registration path in [`src/libs/routes/index.ts`](src/libs/routes/index.ts) - a known, documented minor wart, not a functional issue. |

Routes are typed via `GetRoute` / `PostRoute` / `PostWithFileRoute` discriminated unions in [`src/libs/routes/types.ts`](src/libs/routes/types.ts) - the type system enforces that `user2`-authenticated routes declare a `scope` and other auth modes don't. [`src/libs/routes/index.ts`](src/libs/routes/index.ts) statically imports every route file and assembles `routes.list` (HTTP) and `routesWS.list` (WebSocket). [`src/app.ts`](src/app.ts) builds each route's middleware array dynamically from its declared fields, then always appends `apiPipeline(route)` before the shared `errorHandler`. The middleware pipeline order:

```
loggingHandler → [multipartHandler if file route] → [auth middleware per route.authentication] → [validatePostBody if POST] → apiPipeline(route) → errorHandler (global)
```

### Business Modules

| | |
|---|---|
| Scope | Feature business logic, DB/Elasticsearch/S3 access, external API calls. Routes call into these; these don't call routes. |
| Size / complexity | 85 `.ts` files across 19 module folders. `homeTracker` is by far the largest (~1160 lines, `services/` subfolder with 7+ files); `gravitrips` is the densest single-file logic (`Game.ts`/`board.ts`/`gameService.ts`); `webStats` and `monitoring` are near-trivial (~10-19 lines). |
| Quality | Functionally solid and consistently thin-routes/fat-modules, but internal layout (flat vs `services/`) and error-handling (`errors.ts` present or not) aren't standardized - see [Patterns](#patterns). |
| Activity | Actively developed - 20 recent commits, dominated by `homeTracker` feature work (sensor boost/sleep control, dashboard filtering, ELK query fixes). |
| Concerns | `homeTracker`'s rapid growth and outsized size relative to other modules is worth watching for a future split (ingestion vs dashboard vs sleep/boost control). Clipboard/Reactor logic duplication, noted in [Patterns](#patterns). |

Representative module layout (`homeTracker`, the largest):

```
homeTracker/
├── index.ts        (re-exports services + types)
├── errors.ts
├── types.ts
└── services/
    ├── ingestData.ts
    ├── getHistogramData.ts
    ├── getPressureHistory.ts
    ├── getSensorsDashboardData.ts
    ├── monitorSensors.ts
    ├── sensorMetaData.ts
    └── weatherForecast.ts
```

### Databases, Errors, Config, Tools

| | |
|---|---|
| Scope | Low-level infrastructure: DB/ES/S3 connections, the `AppError`/error-code system, environment config loading and validation, and CLI/ops tooling (DB init, deploy, OpenAPI generation, user creation). |
| Size / complexity | Small and focused - each of `databases/`, `errors/`, `packages/config/` is under ~200 lines total. Shell tooling in `src/tools/` is more ad hoc. |
| Quality | Good - clear separation of concerns, explanatory comments, honest TODOs (e.g. a manually maintained `ERROR_CODES` list, a script the author calls "largely vibe-coded"). |
| Activity | Actively maintained - `src/tools/` last touched 13 days ago; recent commits include error-code refactors and multiple deploy-script hardening changes. |
| Concerns | [`DEV.md`](DEV.md)'s deploy documentation is stale (see [Build Process](#build-process)). Shell scripts use some ad hoc patterns (`eval` for building mysql commands in [`src/tools/init-db.sh`](src/tools/init-db.sh), a commented-out dead code block). |

[`src/libs/databases/`](src/libs/databases) holds one file per external service: `db.ts` (MySQL pool via `mysql2/promise`), `elk.ts` (Elasticsearch client, with guards refusing destructive index operations on non-local clusters), `s3.ts` (AWS S3 client targeting LocalStack in dev, mocked in tests, R2 in prod). [`src/packages/config/`](src/packages/config) reads env vars per-service in `sources/`, then `services/parseConfig.ts` assembles and validates them against a strict AJV schema (`additionalProperties: false`) at import time - the app crashes on startup if config is invalid, by design. [`src/tools/release/deploy.sh`](src/tools/release/deploy.sh) is the real production deploy path (see [Build Process](#build-process)); `src/tools/release/index.ts` is a vestigial Heroku release-phase hook that just logs.

### Tests

| | |
|---|---|
| Scope | All automated tests and the shared test-helper framework. Covers route-level integration tests, middleware/framework tests, package unit tests, periodic task tests, and script tests. |
| Size / complexity | One test directory per source module, plus a `tests/helpers/` framework with 10 helper types. Moderate complexity concentrated in helper hook ordering. |
| Quality | Well-structured and consistently used across route tests, but hook execution order is comment-documented rather than enforced ([`tests/helpers/mocha/routesMochaWrapper.ts`](tests/helpers/mocha/routesMochaWrapper.ts)), and the `th` export omits one helper (`auth`) that the wrapper still runs. |
| Activity | Actively maintained - 20 recent commits, last change 13 days ago, tracking new route/hook additions. |
| Concerns | No route-level tests for `src/libs/routes/auth/` (see [Tests](#tests) section above) - it's covered only indirectly via framework-level tests. |

Hook execution order across the shared `th` test helpers, as fixed in [`tests/helpers/mocha/routesMochaWrapper.ts`](tests/helpers/mocha/routesMochaWrapper.ts):

```
mysql → auth → auth2 → slack → push → fetch → s3 → slog → elk
```
MySQL runs first so table-clearing happens before anything else that might seed data.

## Quality & Improvement Areas

- **Consistent thin-routes/fat-modules separation** is the strongest structural property of the codebase and is followed uniformly across all 14 feature areas - a newcomer can trust that business logic will be in `src/libs/modules/`, not in route handlers.
- **Module internal layout is not standardized.** Some modules use a `services/` subfolder, others stay flat; some have `errors.ts`/`types.ts`, others don't. This isn't a functional problem but makes the codebase slightly less predictable to navigate - a short convention note (e.g. "graduate to `services/` once a module exceeds N files") would help.
- **Clipboard/Reactor duplication** ([Patterns](#patterns)) is the clearest case of the same problem solved twice instead of sharing an abstraction. Given both are small personal features, this is low priority, but worth merging if either grows.
- **Documentation drift**: [`DEV.md`](DEV.md) describes a deployment mechanism (`git subtree` + Heroku) that no longer exists in the code - the actual mechanism is SSH + Docker Compose via [`src/tools/release/deploy.sh`](src/tools/release/deploy.sh). A newcomer following `DEV.md` literally would look for npm scripts that don't exist. The repo's own [README.md](README.md) TODO list acknowledges docs tend to go stale, so this is a known, low-surprise pattern here rather than a new discovery.
- **Auth route test coverage gap**: `src/libs/routes/auth/` has no route-level integration tests, unlike every other feature module. Given auth underpins every `user2`-scoped endpoint, this is the one coverage gap worth closing first.
- **Error-code whitelist is a sharp edge by design**: the `clientErrors` mechanism ([Patterns](#patterns)) is a deliberate safety net, but forgetting to whitelist a new `AppError` code produces a silent 500 that looks like a crash rather than an intentional client error. This is documented in the project's own [`CLAUDE.md`](CLAUDE.md), so it's a known trade-off, not an oversight - but still worth flagging to anyone adding a new error code for the first time.
- **Overall**: this is a small, actively maintained personal project with clean layering and honest internal documentation (TODOs left in place rather than hidden). The rough edges found are minor and mostly self-acknowledged in the repo's own docs.

## Exploration Paths

**Getting started**: follow [`README.md`](README.md)'s "Usage" section (`npm install`, `npm run setup-githooks`, `npm run env`, `./src/tools/init-db.sh`, `npm run watch`, `npm run serve`). For running tests, see [`README.md`](README.md)'s "Testing" section and the [Tests](#tests) section above for the exact commands. For auth/session details beyond the README, read [`DEV.md`](DEV.md)'s "Auth2 flow" section - it's accurate and detailed, unlike the deployment section.

**A representative feature, end to end - HomeTracker histogram data**:
1. [`src/libs/routes/homeTracker/histogramData.ts`](src/libs/routes/homeTracker/histogramData.ts) - entry point, input/output schema, auth mode.
2. [`src/libs/routes/index.ts`](src/libs/routes/index.ts) - see how the route gets registered into `routes.list`.
3. [`src/app.ts`](src/app.ts) - see the middleware pipeline this route runs through (auth via `user2`/`homeTracker` scope, no POST body).
4. [`src/libs/modules/homeTracker/services/getHistogramData.ts`](src/libs/modules/homeTracker/services) - the actual business logic, querying Elasticsearch.
5. [`src/libs/databases/elk.ts`](src/libs/databases/elk.ts) - the underlying Elasticsearch client this calls into.

This path is worth walking because it touches almost every architectural layer (route, middleware, module, database) in the repo's most actively developed feature.

**Dev tooling**:
- [`src/tools/init-db.sh`](src/tools/init-db.sh) - recreates MySQL tables from [`src/tools/tables/*.sql`](src/tools/tables).
- `npm run generate:sdk` (runs [`scripts/generateSDK.ts`](scripts/generateSDK.ts)) - regenerates the frontend SDK from route schemas; must be run after any route change per [`CLAUDE.md`](CLAUDE.md).
- [`src/tools/openapi/generate_openapi_definition.ts`](src/tools/openapi/generate_openapi_definition.ts) - regenerates the OpenAPI spec served at `/openapi/definition`.
- `npm run user:create` - interactive local user creation (see [`DEV.md`](DEV.md)).
- [`src/tools/release/deploy.sh`](src/tools/release/deploy.sh) - production deploy script, run via `npm run prod:deploy`; read before ever running it manually.

## Documentation Map

- **[`README.md`](README.md)** - setup/usage commands, environment overview (MySQL/Elasticsearch/S3), CI notes, a running TODO list. Primary human-facing entry point.
- **[`DEV.md`](DEV.md)** - user creation, detailed Auth2 session flow, secrets/dotenvx workflow, and monorepo migration notes. The deployment portion is stale - see [Build Process](#build-process).
- **[`DEPLOY.md`](DEPLOY.md)** - current production deployment process (VPS + Docker Compose), consistent with [`src/tools/release/deploy.sh`](src/tools/release/deploy.sh).
- **[`CLAUDE.md`](CLAUDE.md)** - detailed agent-facing guidance: route system, auth modes, middleware pipeline, logging/notifier conventions, testing helper framework, and step-by-step instructions for adding routes/errors/tables. Kept notably up to date and is the most complete single reference for how to extend this codebase.
- **`.claude/`** - project-local Claude Code configuration (not a documentation file).
- No `docs/` directory, no published external/online documentation, and no corporate wiki - this is a personal single-maintainer project.
