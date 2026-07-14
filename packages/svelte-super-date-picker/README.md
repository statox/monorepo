# svelte-super-date-picker

A Svelte 5 port of Kibana's [`EuiSuperDatePicker`](https://eui.elastic.co/docs/components/forms/date-and-time/super-date-picker/):
a quick-select + absolute/relative date range control with auto-refresh.

The EUI source (React + Emotion + moment.js) was used as a **behavioral reference only** -
this package has no dependency on `@elastic/eui`, React, or moment. Date handling uses Luxon,
to stay consistent with the rest of this monorepo's frontend.

## Why no build step

This is a private, unpublished package consumed only by `front/` in this monorepo. `exports`
points directly at TypeScript/Svelte source (`./src/index.ts`); Vite compiles it as part of
`front`'s build. There is no `dist/`, no `main` field, no publish step. See
`packages/sdk/README.md` for the same rationale applied to another package in this repo.

## Usage

Add to `front/package.json`:

```json
"svelte-super-date-picker": "file:../packages/svelte-super-date-picker"
```

Then:

```svelte
<script lang="ts">
  import { SuperDatePicker } from 'svelte-super-date-picker';
</script>

<SuperDatePicker
  start="now-15m"
  end="now"
  onTimeChange={({ start, end }) => { /* ... */ }}
/>
```

## `ShortDate` semantics

Start/end values are strings: either `'now'`, a relative expression (`'now-15m'`, `'now/d'`), or
an absolute ISO 8601 string. Relative expressions must be re-resolved against "now" on every
refresh tick - use the exported `parse()` function to turn a `ShortDate` into a Luxon `DateTime`:

```ts
import { parse } from 'svelte-super-date-picker';

const startMs = parse('now-15m')?.toMillis();
```

## Running tests

```
npm run tests
```
