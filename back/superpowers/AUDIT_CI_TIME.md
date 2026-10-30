# CI Audit Follow-Up

## Context

Audit of GitHub Actions CI for the last 10 merged PRs on `statox/monorepo`, focused on
the `Test and AutoMerge PRs` workflow (`.github/workflows/dependabot-auto-merge-back.yml`),
specifically the `tests` job and its infrastructure setup overhead.

## CI job timings (41 workflow runs / 119 jobs sampled)

| Job | Runs | Avg | Max | Failures |
|---|---|---|---|---|
| `tests` (back) | 28 | 1.8 min | 2.1 min | 3 |
| `checks` (front) | 9 | 0.8 min | 0.9 min | 0 |
| `build` (front) | 9 | 0.5 min | 0.6 min | 0 |
| `lint-and-format` (back) | 28 | 0.5 min | 0.6 min | 5 |
| `lint` (actionlint) | 4 | 0.2 min | 0.3 min | 0 |
| `auto-merge-dependabot` | 41 | ~0 | 0.15 min | 2 |

`tests` is the slowest job. No individual job exceeds ~2.5 minutes.

### Step breakdown inside `tests` (avg 1.8 min total)

| Step | Avg | Max |
|---|---|---|
| Run tests | 32s | 37s |
| Start docker environment | 25s | 37s |
| Init elk | 13s | 16s |
| Install Dependencies | 11s | 14s |
| Build app | 8s | 11s |
| Install node.js | 6s | 11s |
| Stop containers | 3s | 4s |
| Checkout, caching, mysql init, reporting | <2s each | — |

~40s of the ~1.8min job (roughly half) is infrastructure setup (docker environment start,
ELK readiness wait, mysql init) rather than the actual test run.

### Failures observed

| PR | Job | Failed step |
|---|---|---|
| #122 | `lint-and-format` (5 separate runs) | "Check prettier" |
| #122 | `tests` (2 runs) | "Run tests" |
| #125 | `tests` | "Run tests" |
| #129 | `auto-merge-dependabot` | "Auto merge the PR" |
| #131 | `auto-merge-dependabot` | "Auto merge the PR" |

PR #122 failed "Check prettier" 5 consecutive times before passing — a real, repeated
formatting issue, not a one-off flake. The two `auto-merge-dependabot` failures look like
a transient GitHub API/merge race (both PRs merged successfully on retry).

## Investigation into the `tests` job setup overhead

The `tests` job (`.github/workflows/dependabot-auto-merge-back.yml`) runs
`docker compose -f back/src/tools/docker-compose.yml up -d`, which starts three services:
`db` (MySQL), `rustfs` (S3-compatible storage), and `elk` (Elasticsearch 8.15.2). This is
followed by explicit polling scripts (`init-db.sh`, `init-elk.sh`) that block until each
service is ready.

All setup steps run strictly sequentially: checkout → install deps → start docker (25s) →
build app → init mysql → init elk (13s) → run tests. Nothing currently overlaps.

Checked what the tests actually depend on for each service:

- **S3/rustfs**: fully mocked in tests via `aws-sdk-client-mock` (`s3Mock`, see
  `tests/helpers/s3/index.ts`). No test in the suite calls the real `rustfs` container.
- **Elasticsearch/elk**: not mocked. Tests spy on `elk.index` (`tests/helpers/elk/index.ts`)
  but issue genuine reads/writes against the live ES container, including an explicit
  index-refresh workaround to deal with ES indexing latency during searches.
- **MySQL**: real and required, as expected.

## Possible approaches identified (not evaluated/prioritized further here)

1. Remove the `rustfs` service from the CI docker-compose setup, since no test exercises it.
2. Start the docker environment in parallel with `npm ci`/build instead of sequentially,
   blocking on readiness only right before the tests step.
3. Replace the docker-compose-based service startup with GitHub Actions native `services:`
   containers, which support built-in health-check waiting and can start before job steps run.
4. Reduce Elasticsearch image pull/startup time (image layer caching, or a self-hosted/
   persistent runner that keeps images warm between runs).
