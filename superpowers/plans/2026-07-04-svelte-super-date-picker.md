# Svelte Super Date Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `packages/svelte-super-date-picker`, a Svelte 5 port of Kibana's `EuiSuperDatePicker`, and prove it out via a standalone demo route in `front`.

**Architecture:** A source-only package (no build step, consumed by `front` via a `file:` dependency and compiled by Vite - same pattern as `packages/sdk`). Pure parsing/formatting logic (relative date-math, quick-select parsing, pretty-duration formatting, refresh-interval math) lives in plain `.ts` modules with Vitest coverage. UI lives in Svelte 5 components (runes-based, callback-driven props, no stores) styled with `front`'s existing CSS custom properties (`--nc-*` from `new_theme.css`). Absolute date entry uses native `<input type="datetime-local">` instead of a custom calendar widget.

**Tech Stack:** TypeScript (strict), Svelte 5, Luxon (date handling - no moment.js), Vitest, ESLint (`eslint-plugin-svelte` + `typescript-eslint`), Prettier (`prettier-plugin-svelte`).

**Reference:** EUI source cloned locally and gitignored at `/home/adrien/dev/monorepo/eui/packages/eui/src/components/date_picker/` - read-only reference for behavior, never imported or committed.

**Spec:** `superpowers/specs/2026-07-03-svelte-super-date-picker-design.md`

---

## File Structure

```
packages/svelte-super-date-picker/
├── src/
│   ├── date-math.ts                 # parse, getDateMode, parseRelativeParts, toRelativeStringFromParts, toRelativeString, toAbsoluteString, isRelativeToNow
│   ├── date-math.test.ts
│   ├── quick-select-utils.ts        # parseTimeParts
│   ├── quick-select-utils.test.ts
│   ├── pretty-duration.ts           # prettyDuration, showPrettyDuration
│   ├── pretty-duration.test.ts
│   ├── async-interval.ts            # AsyncInterval class
│   ├── async-interval.test.ts
│   ├── refresh-interval-utils.ts    # fromMilliseconds, toMilliseconds, getMinInterval
│   ├── refresh-interval-utils.test.ts
│   ├── time-options.ts              # static data: commonDurationRanges, relativeOptions, timeUnitsOptions, refreshUnitsOptions, relativeRoundingLabels
│   ├── types.ts
│   ├── components/
│   │   ├── QuickSelectPanel.svelte
│   │   ├── CommonlyUsedRanges.svelte
│   │   ├── RecentlyUsedRanges.svelte
│   │   ├── QuickSelect.svelte
│   │   ├── RefreshIntervalControl.svelte
│   │   ├── QuickSelectPopover.svelte
│   │   ├── AbsoluteTab.svelte
│   │   ├── RelativeTab.svelte
│   │   ├── DatePopoverButton.svelte
│   │   └── UpdateButton.svelte
│   ├── SuperDatePicker.svelte
│   └── index.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.mjs
├── svelte.config.js
├── .prettierrc
└── README.md
```

`front/src/routes/(noso)/svelte-super-date-picker-demo/+page.svelte` - demo route (new).

---

### Task 1: Scaffold the package

**Files:**
- Create: `packages/svelte-super-date-picker/package.json`
- Create: `packages/svelte-super-date-picker/tsconfig.json`
- Create: `packages/svelte-super-date-picker/eslint.config.mjs`
- Create: `packages/svelte-super-date-picker/.prettierrc`
- Create: `packages/svelte-super-date-picker/vitest.config.ts`
- Create: `packages/svelte-super-date-picker/svelte.config.js`
- Create: `packages/svelte-super-date-picker/README.md`
- Modify: `front/package.json`

- [ ] **Step 1: Create `package.json`**

```json
{
    "name": "svelte-super-date-picker",
    "version": "1.0.0",
    "type": "module",
    "exports": {
        ".": "./src/index.ts"
    },
    "scripts": {
        "check": "npm run lint && npm run prettier",
        "lint": "eslint",
        "prettier": "prettier --check 'src/**/*.{ts,svelte}'",
        "prettier:fix": "prettier --write 'src/**/*.{ts,svelte}'",
        "tests": "vitest run"
    },
    "peerDependencies": {
        "svelte": "^5.0.0"
    },
    "dependencies": {
        "luxon": "^3.7.2"
    },
    "devDependencies": {
        "@eslint/js": "^10.0.1",
        "@sveltejs/vite-plugin-svelte": "^7.1.2",
        "@types/luxon": "^3.7.2",
        "eslint": "^10.3.0",
        "eslint-config-prettier": "^10.1.8",
        "eslint-plugin-svelte": "^3.19.0",
        "globals": "^17.6.0",
        "prettier": "^3.8.3",
        "prettier-plugin-svelte": "^4.1.1",
        "svelte": "^5.56.4",
        "svelte-eslint-parser": "^1.4.0",
        "typescript": "^6.0.3",
        "typescript-eslint": "^8.62.0",
        "vite": "^8.1.0",
        "vitest": "^4.0.0"
    }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
    "compilerOptions": {
        "allowJs": true,
        "checkJs": true,
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "lib": ["es2023", "dom"],
        "module": "nodenext",
        "moduleResolution": "nodenext",
        "skipLibCheck": true,
        "strict": true,
        "target": "es2022",
        "types": ["node"]
    }
}
```

- [ ] **Step 3: Create `svelte.config.js`**

```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess()
};

export default config;
```

- [ ] **Step 4: Create `eslint.config.mjs`**

```js
import eslintJS from '@eslint/js';
import eslintPrettier from 'eslint-config-prettier';
import eslintSvelte from 'eslint-plugin-svelte';
import eslintTS from 'typescript-eslint';
import globals from 'globals';
import svelteConfig from './svelte.config.js';
import svelteParser from 'svelte-eslint-parser';
import { defineConfig } from 'eslint/config';

export default defineConfig(
    { ignores: ['**/*.d.ts', 'node_modules/**'] },
    eslintJS.configs.recommended,
    ...eslintTS.configs.recommended,
    ...eslintSvelte.configs.recommended,
    ...eslintSvelte.configs.prettier,
    eslintPrettier,
    {
        files: ['**/*.svelte'],
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: eslintTS.parser,
                svelteConfig
            },
            globals: {
                ...globals.browser
            }
        }
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: eslintTS.parser,
            globals: {
                ...globals.node
            }
        },
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', { caughtErrorsIgnorePattern: '^_' }]
        }
    }
);
```

- [ ] **Step 5: Create `.prettierrc`**

```json
{
    "useTabs": false,
    "tabWidth": 4,
    "singleQuote": true,
    "trailingComma": "none",
    "printWidth": 100,
    "plugins": ["prettier-plugin-svelte"],
    "overrides": [
        {
            "files": "*.svelte",
            "options": {
                "parser": "svelte"
            }
        }
    ]
}
```

- [ ] **Step 6: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts']
    }
});
```

- [ ] **Step 7: Create `README.md`**

```md
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

\`\`\`json
"svelte-super-date-picker": "file:../packages/svelte-super-date-picker"
\`\`\`

Then:

\`\`\`svelte
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

\`\`\`ts
import { parse } from 'svelte-super-date-picker';

const startMs = parse('now-15m')?.toMillis();
\`\`\`

## Running tests

\`\`\`
npm run tests
\`\`\`
```

- [ ] **Step 8: Add the package as a `front` dependency**

Edit `front/package.json`, in the `devDependencies` block (alphabetical, next to `svelte-jsoneditor`):

```json
"svelte-super-date-picker": "file:../packages/svelte-super-date-picker",
```

- [ ] **Step 9: Install and verify the workspace link**

Run from `front/`:
```bash
npm install
```
Expected: `front/node_modules/svelte-super-date-picker` is a symlink to `../../packages/svelte-super-date-picker`. Verify with:
```bash
ls -la front/node_modules/svelte-super-date-picker
```
Expected output shows it as a symlink (`->`) pointing at `../../packages/svelte-super-date-picker`.

- [ ] **Step 10: Install the new package's own dependencies**

Run from `packages/svelte-super-date-picker/`:
```bash
npm install
```

- [ ] **Step 11: Commit**

```bash
git add packages/svelte-super-date-picker/package.json packages/svelte-super-date-picker/tsconfig.json \
  packages/svelte-super-date-picker/eslint.config.mjs packages/svelte-super-date-picker/.prettierrc \
  packages/svelte-super-date-picker/vitest.config.ts packages/svelte-super-date-picker/svelte.config.js \
  packages/svelte-super-date-picker/README.md front/package.json front/package-lock.json \
  packages/svelte-super-date-picker/package-lock.json
git commit -m "Scaffold svelte-super-date-picker package"
```

---

### Task 2: Core types

**Files:**
- Create: `packages/svelte-super-date-picker/src/types.ts`

- [ ] **Step 1: Write `types.ts`**

```ts
export type NowDateMode = 'now';
export type AbsoluteDateMode = 'absolute';
export type RelativeDateMode = 'relative';
export type DateMode = NowDateMode | AbsoluteDateMode | RelativeDateMode;

/**
 * Either datemath (e.g. 'now', 'now-15m', 'now-15m/m') or an absolute
 * ISO 8601 date string.
 */
export type ShortDate = NowDateMode | string;

export type Milliseconds = number;

export type TimeUnitId = 's' | 'm' | 'h' | 'd' | 'w' | 'M' | 'y';
export type TimeUnitFromNowId = 's+' | 'm+' | 'h+' | 'd+' | 'w+' | 'M+' | 'y+';
export type TimeUnitAllId = TimeUnitId | TimeUnitFromNowId;

export interface RelativeParts {
    count: number;
    round: boolean;
    roundUnit?: TimeUnitId;
    unit: string;
}

export interface DurationRange {
    start: ShortDate;
    end: ShortDate;
    label?: string;
}

export const REFRESH_UNIT_OPTIONS = ['s', 'm', 'h'] as const;
export type RefreshUnitsOptions = (typeof REFRESH_UNIT_OPTIONS)[number];

export interface QuickSelect {
    timeTense: 'last' | 'next';
    timeValue: number;
    timeUnits: TimeUnitId;
}

export interface OnTimeChangeProps extends DurationRange {
    isInvalid: boolean;
    isQuickSelection: boolean;
}

export interface OnRefreshProps extends DurationRange {
    refreshInterval: Milliseconds;
}

export interface OnRefreshChangeProps {
    isPaused: boolean;
    refreshInterval: Milliseconds;
    intervalUnits: RefreshUnitsOptions;
}
```

- [ ] **Step 2: Verify it compiles**

Run from `packages/svelte-super-date-picker/`:
```bash
npx tsc --noEmit -p tsconfig.json
```
Expected: no errors (only `types.ts` exists so far, nothing imports it yet - this just checks syntax).

- [ ] **Step 3: Commit**

```bash
git add packages/svelte-super-date-picker/src/types.ts
git commit -m "Add core types for svelte-super-date-picker"
```

---

### Task 3: `date-math.ts` - parsing and formatting relative/absolute dates

This is the module every other piece of the picker depends on. It ports `relative_utils.ts` +
`date_modes.ts` from EUI, replacing `moment` + `@elastic/datemath` with Luxon.

**Files:**
- Create: `packages/svelte-super-date-picker/src/date-math.ts`
- Create: `packages/svelte-super-date-picker/src/date-math.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import {
    DATE_MODES,
    INVALID_DATE,
    getDateMode,
    isRelativeToNow,
    parse,
    parseRelativeParts,
    toAbsoluteString,
    toRelativeString,
    toRelativeStringFromParts
} from './date-math';

const NOW = DateTime.fromISO('2026-07-04T12:00:00.000Z');

describe('getDateMode', () => {
    it('returns "now" for the literal string "now"', () => {
        expect(getDateMode('now')).toBe(DATE_MODES.NOW);
    });

    it('returns "relative" for expressions containing now', () => {
        expect(getDateMode('now-15m')).toBe(DATE_MODES.RELATIVE);
        expect(getDateMode('now/d')).toBe(DATE_MODES.RELATIVE);
    });

    it('returns "absolute" for ISO strings', () => {
        expect(getDateMode('2026-07-04T12:00:00.000Z')).toBe(DATE_MODES.ABSOLUTE);
    });
});

describe('parse', () => {
    it('parses "now" to the reference instant', () => {
        expect(parse('now', { now: NOW })?.toMillis()).toBe(NOW.toMillis());
    });

    it('parses a "now-Nunit" relative offset', () => {
        const result = parse('now-15m', { now: NOW });
        expect(result?.toISO()).toBe(NOW.minus({ minutes: 15 }).toISO());
    });

    it('parses a "now+Nunit" relative offset', () => {
        const result = parse('now+2h', { now: NOW });
        expect(result?.toISO()).toBe(NOW.plus({ hours: 2 }).toISO());
    });

    it('rounds down to the start of the unit by default when a snap is present', () => {
        const result = parse('now/d', { now: NOW });
        expect(result?.toISO()).toBe(NOW.startOf('day').toISO());
    });

    it('rounds up to the end of the unit when roundUp is true', () => {
        const result = parse('now/d', { now: NOW, roundUp: true });
        expect(result?.toISO()).toBe(NOW.endOf('day').toISO());
    });

    it('applies the snap after the offset', () => {
        const result = parse('now-1d/d', { now: NOW });
        expect(result?.toISO()).toBe(NOW.minus({ days: 1 }).startOf('day').toISO());
    });

    it('parses an absolute ISO string', () => {
        const result = parse('2020-01-01T00:00:00.000Z');
        expect(result?.toISO()).toBe(DateTime.fromISO('2020-01-01T00:00:00.000Z').toISO());
    });

    it('returns null for an invalid string', () => {
        expect(parse('not-a-date')).toBeNull();
    });
});

describe('parseRelativeParts / toRelativeStringFromParts round-trip', () => {
    it('parses now-40m', () => {
        expect(parseRelativeParts('now-40m')).toEqual({ count: 40, unit: 'm', round: false });
    });

    it('parses now+40m', () => {
        expect(parseRelativeParts('now+40m')).toEqual({ count: 40, unit: 'm+', round: false });
    });

    it('parses now-1d/d as rounded', () => {
        expect(parseRelativeParts('now-1d/d')).toEqual({
            count: 1,
            unit: 'd',
            round: true,
            roundUnit: 'd'
        });
    });

    it('parses bare "now" as zero count', () => {
        expect(parseRelativeParts('now')).toEqual({ count: 0, unit: 's', round: false });
    });

    it('formats parts back into a relative string', () => {
        expect(toRelativeStringFromParts({ count: 40, unit: 'm', round: false })).toBe('now-40m');
        expect(toRelativeStringFromParts({ count: 40, unit: 'm+', round: false })).toBe('now+40m');
        expect(
            toRelativeStringFromParts({ count: 1, unit: 'd', round: true, roundUnit: 'd' })
        ).toBe('now-1d/d');
        expect(toRelativeStringFromParts({ count: 0, unit: 's', round: false })).toBe('now');
    });

    it('round-trips an absolute string into an approximate relative string', () => {
        const twoHoursAgo = NOW.minus({ hours: 2 }).toISO() as string;
        expect(toRelativeString(twoHoursAgo)).toBe('now-2h');
    });
});

describe('isRelativeToNow', () => {
    it('is true for a relative start and "now" end', () => {
        expect(isRelativeToNow('now-15m', 'now')).toBe(true);
    });

    it('is true for a "now" start and relative end (future window)', () => {
        expect(isRelativeToNow('now', 'now+15m')).toBe(true);
    });

    it('is false for two absolute dates', () => {
        expect(isRelativeToNow('2020-01-01T00:00:00.000Z', '2020-01-02T00:00:00.000Z')).toBe(
            false
        );
    });
});

describe('toAbsoluteString / toRelativeString', () => {
    it('resolves a relative string to an ISO string', () => {
        expect(toAbsoluteString('now-15m')).not.toBe(INVALID_DATE);
        expect(() => DateTime.fromISO(toAbsoluteString('now-15m'))).not.toThrow();
    });

    it('returns INVALID_DATE for unparseable input', () => {
        expect(toAbsoluteString('not-a-date')).toBe(INVALID_DATE);
    });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run from `packages/svelte-super-date-picker/`:
```bash
npx vitest run src/date-math.test.ts
```
Expected: FAIL - `date-math.ts` does not exist yet.

- [ ] **Step 3: Implement `date-math.ts`**

```ts
import { DateTime, Duration, type DateTimeUnit } from 'luxon';
import type { RelativeParts, ShortDate, TimeUnitId } from './types';

const ROUND_DELIMITER = '/';

export const relativeUnitsFromLargestToSmallest: TimeUnitId[] = ['y', 'M', 'w', 'd', 'h', 'm', 's'];

const UNIT_TO_LUXON_PLURAL: Record<TimeUnitId, string> = {
    y: 'years',
    M: 'months',
    w: 'weeks',
    d: 'days',
    h: 'hours',
    m: 'minutes',
    s: 'seconds'
};

const UNIT_TO_LUXON_SINGULAR: Record<TimeUnitId, DateTimeUnit> = {
    y: 'year',
    M: 'month',
    w: 'week',
    d: 'day',
    h: 'hour',
    m: 'minute',
    s: 'second'
};

export const DATE_MODES = {
    ABSOLUTE: 'absolute',
    RELATIVE: 'relative',
    NOW: 'now'
} as const;

export const INVALID_DATE = 'invalid_date';

const RELATIVE_PATTERN = /^now(([-+])(\d+)([smhdwMy])(\/[smhdwMy])?)?$/;

export function getDateMode(value: ShortDate): (typeof DATE_MODES)[keyof typeof DATE_MODES] {
    if (value === 'now') return DATE_MODES.NOW;
    if (value.includes('now')) return DATE_MODES.RELATIVE;
    return DATE_MODES.ABSOLUTE;
}

export function parse(
    value: ShortDate,
    opts: { roundUp?: boolean; now?: DateTime } = {}
): DateTime | null {
    const now = opts.now ?? DateTime.now();
    if (typeof value !== 'string') return null;

    if (value === 'now') return now;

    if (value.startsWith('now')) {
        const matches = value.match(RELATIVE_PATTERN);
        if (!matches) return null;

        const [, , operator, countStr, unit, roundToken] = matches;
        let result = now;

        if (operator && countStr && unit) {
            const count = parseInt(countStr, 10);
            const luxonUnit = UNIT_TO_LUXON_PLURAL[unit as TimeUnitId];
            result =
                operator === '+'
                    ? result.plus({ [luxonUnit]: count })
                    : result.minus({ [luxonUnit]: count });
        }

        if (roundToken) {
            const roundUnit = roundToken.slice(1) as TimeUnitId;
            const luxonUnit = UNIT_TO_LUXON_SINGULAR[roundUnit];
            result = opts.roundUp ? result.endOf(luxonUnit) : result.startOf(luxonUnit);
        }

        return result;
    }

    const parsed = DateTime.fromISO(value);
    return parsed.isValid ? parsed : null;
}

export function parseRelativeParts(value: string, now: DateTime = DateTime.now()): RelativeParts {
    const matches = typeof value === 'string' ? value.match(RELATIVE_PATTERN) : null;
    const operator = matches?.[2];
    const count = matches?.[3];
    const unit = matches?.[4];
    const roundBy = matches?.[5];

    if (count && unit) {
        const isRounded = !!roundBy;
        const roundUnit = isRounded && roundBy ? (roundBy.replace(ROUND_DELIMITER, '') as TimeUnitId) : undefined;
        return {
            count: parseInt(count, 10),
            unit: operator === '+' ? `${unit}+` : unit,
            round: isRounded,
            ...(roundUnit ? { roundUnit } : {})
        };
    }

    const results: RelativeParts = { count: 0, unit: 's', round: false };
    const parsedValue = parse(value, { now });
    if (!parsedValue) return results;

    const diffMs = now.diff(parsedValue).as('milliseconds');
    let unitOp = '';
    for (const unitId of relativeUnitsFromLargestToSmallest) {
        const asUnit = Duration.fromMillis(diffMs).as(UNIT_TO_LUXON_PLURAL[unitId] as never);
        if (asUnit < 0) unitOp = '+';
        if (Math.abs(asUnit) > 1) {
            results.count = Math.round(Math.abs(asUnit));
            results.unit = unitId + unitOp;
            results.round = false;
            break;
        }
    }
    return results;
}

export function toRelativeStringFromParts(parts: RelativeParts): string {
    const { count, round: isRounded, unit: rawUnit } = parts;

    if (count === 0 && !isRounded) {
        return 'now';
    }

    const matches = rawUnit.match(/([smhdwMy])(\+)?/);
    const unit = matches ? matches[1] : 's';
    const operator = matches?.[2] ? matches[2] : '-';
    const round = isRounded ? `${ROUND_DELIMITER}${unit}` : '';

    return `now${operator}${count}${unit}${round}`;
}

export function isRelativeToNow(start: ShortDate, end: ShortDate): boolean {
    const startMode = getDateMode(start);
    const endMode = getDateMode(end);
    const isLast = startMode === DATE_MODES.RELATIVE && endMode === DATE_MODES.NOW;
    const isNext = startMode === DATE_MODES.NOW && endMode === DATE_MODES.RELATIVE;
    return isLast || isNext;
}

export function toAbsoluteString(value: ShortDate, roundUp = false): string {
    const parsed = parse(value, { roundUp });
    if (!parsed) return value;
    if (!parsed.isValid) return INVALID_DATE;
    return parsed.toISO() ?? INVALID_DATE;
}

export function toRelativeString(value: string): string {
    return toRelativeStringFromParts(parseRelativeParts(value));
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run from `packages/svelte-super-date-picker/`:
```bash
npx vitest run src/date-math.test.ts
```
Expected: all tests PASS.

- [ ] **Step 5: Lint and format**

```bash
npm run lint
npm run prettier:fix
```

- [ ] **Step 6: Commit**

```bash
git add packages/svelte-super-date-picker/src/date-math.ts packages/svelte-super-date-picker/src/date-math.test.ts
git commit -m "Add date-math module (Luxon port of EUI's relative_utils/date_modes)"
```

---

### Task 4: `time-options.ts` - static option data

Pure data, ported from `time_options.tsx` with i18n stripped (English only, per design).

**Files:**
- Create: `packages/svelte-super-date-picker/src/time-options.ts`

- [ ] **Step 1: Write `time-options.ts`**

```ts
import type { DurationRange, RefreshUnitsOptions, TimeUnitAllId, TimeUnitId } from './types';

export const LAST = 'last';
export const NEXT = 'next';

export interface SelectOption {
    value: string;
    text: string;
}

export interface RelativeOption {
    value: TimeUnitAllId;
    text: string;
}

export const timeTenseOptions: SelectOption[] = [
    { value: LAST, text: 'Last' },
    { value: NEXT, text: 'Next' }
];

export const timeUnitsOptions: SelectOption[] = [
    { value: 's', text: 'Seconds' },
    { value: 'm', text: 'Minutes' },
    { value: 'h', text: 'Hours' },
    { value: 'd', text: 'Days' },
    { value: 'w', text: 'Weeks' },
    { value: 'M', text: 'Months' },
    { value: 'y', text: 'Years' }
];

export const relativeOptions: RelativeOption[] = [
    { value: 's', text: 'Seconds ago' },
    { value: 'm', text: 'Minutes ago' },
    { value: 'h', text: 'Hours ago' },
    { value: 'd', text: 'Days ago' },
    { value: 'w', text: 'Weeks ago' },
    { value: 'M', text: 'Months ago' },
    { value: 'y', text: 'Years ago' },
    { value: 's+', text: 'Seconds from now' },
    { value: 'm+', text: 'Minutes from now' },
    { value: 'h+', text: 'Hours from now' },
    { value: 'd+', text: 'Days from now' },
    { value: 'w+', text: 'Weeks from now' },
    { value: 'M+', text: 'Months from now' },
    { value: 'y+', text: 'Years from now' }
];

export const relativeRoundingLabels: Record<TimeUnitId, string> = {
    s: 'Round to the second',
    m: 'Round to the minute',
    h: 'Round to the hour',
    d: 'Round to the day',
    w: 'Round to the week',
    M: 'Round to the month',
    y: 'Round to the year'
};

export const refreshUnitsOptions: { value: RefreshUnitsOptions; text: string }[] =
    timeUnitsOptions.filter(
        (option): option is { value: RefreshUnitsOptions; text: string } =>
            option.value === 'h' || option.value === 'm' || option.value === 's'
    );

export const commonDurationRanges: DurationRange[] = [
    { start: 'now/d', end: 'now/d', label: 'Today' },
    { start: 'now/w', end: 'now/w', label: 'This week' },
    { start: 'now/M', end: 'now/M', label: 'This month' },
    { start: 'now/y', end: 'now/y', label: 'This year' },
    { start: 'now-1d/d', end: 'now-1d/d', label: 'Yesterday' },
    { start: 'now/w', end: 'now', label: 'Week to date' },
    { start: 'now/M', end: 'now', label: 'Month to date' },
    { start: 'now/y', end: 'now', label: 'Year to date' }
];
```

- [ ] **Step 2: Verify it compiles and lints**

Run from `packages/svelte-super-date-picker/`:
```bash
npx tsc --noEmit -p tsconfig.json
npm run lint
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/svelte-super-date-picker/src/time-options.ts
git commit -m "Add static time-options data"
```

---

### Task 5: `quick-select-utils.ts` - deriving Last/Next N units from a range

Ports `quick_select_utils.ts`'s `parseTimeParts`: given the current start/end, figures out the
"Last 15 Minutes" style default shown in the quick-select popover.

**Files:**
- Create: `packages/svelte-super-date-picker/src/quick-select-utils.ts`
- Create: `packages/svelte-super-date-picker/src/quick-select-utils.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import { parseTimeParts } from './quick-select-utils';

const NOW = DateTime.fromISO('2026-07-04T12:00:00.000Z');

describe('parseTimeParts', () => {
    it('parses a "last" window from start=now-40m, end=now', () => {
        expect(parseTimeParts('now-40m', 'now', NOW)).toEqual({
            timeTense: 'last',
            timeUnits: 'm',
            timeValue: 40
        });
    });

    it('parses a "next" window from start=now, end=now+2h', () => {
        expect(parseTimeParts('now', 'now+2h', NOW)).toEqual({
            timeTense: 'next',
            timeUnits: 'h',
            timeValue: 2
        });
    });

    it('falls back to approximating an absolute start against now', () => {
        const twoHoursAgo = NOW.minus({ hours: 2 }).toISO() as string;
        expect(parseTimeParts(twoHoursAgo, 'now', NOW)).toEqual({
            timeTense: 'last',
            timeUnits: 'h',
            timeValue: 2
        });
    });

    it('defaults to "last 15 minutes" for unparseable input', () => {
        expect(parseTimeParts('not-a-date', 'now', NOW)).toEqual({
            timeTense: 'last',
            timeUnits: 'm',
            timeValue: 15
        });
    });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run from `packages/svelte-super-date-picker/`:
```bash
npx vitest run src/quick-select-utils.test.ts
```
Expected: FAIL - `quick-select-utils.ts` does not exist yet.

- [ ] **Step 3: Implement `quick-select-utils.ts`**

```ts
import { DateTime, Duration } from 'luxon';
import { parse, relativeUnitsFromLargestToSmallest } from './date-math';
import type { QuickSelect, TimeUnitId } from './types';

const UNIT_TO_LUXON_PLURAL: Record<TimeUnitId, string> = {
    y: 'years',
    M: 'months',
    w: 'weeks',
    d: 'days',
    h: 'hours',
    m: 'minutes',
    s: 'seconds'
};

const RELATIVE_PATTERN = /^now(([-+])(\d+)([smhdwMy])(\/[smhdwMy])?)?$/;

const isNow = (value: string) => value === 'now';

export function parseTimeParts(
    start: string,
    end: string,
    now: DateTime = DateTime.now()
): QuickSelect {
    const fallback: QuickSelect = { timeTense: 'last', timeUnits: 'm', timeValue: 15 };

    const value = isNow(start) ? end : start;
    const matches = typeof value === 'string' ? value.match(RELATIVE_PATTERN) : null;
    if (!matches) return fallback;

    const operator = matches[2];
    const matchedTimeValue = matches[3];
    const timeUnits = matches[4] as TimeUnitId;

    if (matchedTimeValue && timeUnits && operator) {
        return {
            timeTense: operator === '+' ? 'next' : 'last',
            timeUnits,
            timeValue: parseInt(matchedTimeValue, 10)
        };
    }

    const parsedValue = parse(value, { now });
    if (!parsedValue) return fallback;

    const diffMs = now.diff(parsedValue).as('milliseconds');
    let unitOp = '';
    for (const unitId of relativeUnitsFromLargestToSmallest) {
        const asUnit = Duration.fromMillis(diffMs).as(UNIT_TO_LUXON_PLURAL[unitId] as never);
        if (asUnit < 0) unitOp = '+';
        if (Math.abs(asUnit) > 1) {
            return {
                timeValue: Math.round(Math.abs(asUnit)),
                timeUnits: unitId,
                timeTense: unitOp === '+' ? 'next' : 'last'
            };
        }
    }

    return fallback;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
npx vitest run src/quick-select-utils.test.ts
```
Expected: all tests PASS.

- [ ] **Step 5: Lint and format**

```bash
npm run lint
npm run prettier:fix
```

- [ ] **Step 6: Commit**

```bash
git add packages/svelte-super-date-picker/src/quick-select-utils.ts packages/svelte-super-date-picker/src/quick-select-utils.test.ts
git commit -m "Add quick-select-utils module"
```

---

### Task 6: `refresh-interval-utils.ts` - ms <-> value/unit conversion

Ports the pure conversion functions from `refresh_interval.tsx`.

**Files:**
- Create: `packages/svelte-super-date-picker/src/refresh-interval-utils.ts`
- Create: `packages/svelte-super-date-picker/src/refresh-interval-utils.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { fromMilliseconds, getMinInterval, toMilliseconds } from './refresh-interval-utils';

describe('fromMilliseconds', () => {
    it('picks hours when the value exceeds an hour and no unit is forced', () => {
        expect(fromMilliseconds(2 * 60 * 60 * 1000)).toEqual({ units: 'h', value: 2 });
    });

    it('picks minutes when the value exceeds a minute and no unit is forced', () => {
        expect(fromMilliseconds(90 * 1000)).toEqual({ units: 'm', value: 1.5 });
    });

    it('falls back to seconds', () => {
        expect(fromMilliseconds(500)).toEqual({ units: 's', value: 0.5 });
    });

    it('respects a forced unit', () => {
        expect(fromMilliseconds(500, 'm')).toEqual({ units: 'm', value: 0.01 });
    });
});

describe('toMilliseconds', () => {
    it('converts hours', () => {
        expect(toMilliseconds('h', 2)).toBe(2 * 60 * 60 * 1000);
    });

    it('converts minutes', () => {
        expect(toMilliseconds('m', 1.5)).toBe(90 * 1000);
    });

    it('converts seconds', () => {
        expect(toMilliseconds('s', 0.5)).toBe(500);
    });
});

describe('getMinInterval', () => {
    it('returns 0 when no minInterval is given', () => {
        expect(getMinInterval()).toBe(0);
    });

    it('converts and floors the minInterval into the given unit', () => {
        expect(getMinInterval(90 * 1000, 'm')).toBe(1);
    });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
npx vitest run src/refresh-interval-utils.test.ts
```
Expected: FAIL - module does not exist yet.

- [ ] **Step 3: Implement `refresh-interval-utils.ts`**

```ts
import type { Milliseconds, RefreshUnitsOptions } from './types';

const MILLISECONDS_IN_SECOND = 1000;
const MILLISECONDS_IN_MINUTE = MILLISECONDS_IN_SECOND * 60;
const MILLISECONDS_IN_HOUR = MILLISECONDS_IN_MINUTE * 60;

export interface RefreshIntervalValue {
    value: number;
    units: RefreshUnitsOptions;
}

export function fromMilliseconds(
    milliseconds: Milliseconds,
    unit?: RefreshUnitsOptions
): RefreshIntervalValue {
    const round = (value: number) => parseFloat(value.toFixed(2));

    if (unit === 'h' || (!unit && milliseconds > MILLISECONDS_IN_HOUR)) {
        return { units: 'h', value: round(milliseconds / MILLISECONDS_IN_HOUR) };
    }

    if (unit === 'm' || (!unit && milliseconds > MILLISECONDS_IN_MINUTE)) {
        return { units: 'm', value: round(milliseconds / MILLISECONDS_IN_MINUTE) };
    }

    return { units: 's', value: round(milliseconds / MILLISECONDS_IN_SECOND) };
}

export function toMilliseconds(units: RefreshUnitsOptions, value: number): Milliseconds {
    switch (units) {
        case 'h':
            return Math.round(value * MILLISECONDS_IN_HOUR);
        case 'm':
            return Math.round(value * MILLISECONDS_IN_MINUTE);
        case 's':
        default:
            return Math.round(value * MILLISECONDS_IN_SECOND);
    }
}

export function getMinInterval(minInterval?: Milliseconds, unit?: RefreshUnitsOptions): number {
    if (!minInterval) return 0;
    const { value } = fromMilliseconds(minInterval, unit);
    return Math.floor(value || 0);
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
npx vitest run src/refresh-interval-utils.test.ts
```
Expected: all tests PASS.

- [ ] **Step 5: Lint and format**

```bash
npm run lint
npm run prettier:fix
```

- [ ] **Step 6: Commit**

```bash
git add packages/svelte-super-date-picker/src/refresh-interval-utils.ts packages/svelte-super-date-picker/src/refresh-interval-utils.test.ts
git commit -m "Add refresh-interval-utils module"
```

---

### Task 7: `pretty-duration.ts` - formatting a range as a human string

Ports the non-hook parts of `pretty_duration.tsx`: `showPrettyDuration` and a pure `prettyDuration`
function (the i18n render-prop machinery is dropped; English strings are inlined).

**Files:**
- Create: `packages/svelte-super-date-picker/src/pretty-duration.ts`
- Create: `packages/svelte-super-date-picker/src/pretty-duration.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import { commonDurationRanges } from './time-options';
import { prettyDuration, showPrettyDuration } from './pretty-duration';

const NOW = DateTime.fromISO('2026-07-04T12:00:00.000Z');
const dateFormat = "MMM d, yyyy @ HH:mm:ss";

describe('prettyDuration', () => {
    it('uses the matching commonly-used range label when start/end match exactly', () => {
        expect(
            prettyDuration('now/d', 'now/d', { commonlyUsedRanges: commonDurationRanges, dateFormat, now: NOW })
        ).toBe('Today');
    });

    it('formats a relative "last N unit" window', () => {
        expect(
            prettyDuration('now-15m', 'now', { commonlyUsedRanges: [], dateFormat, now: NOW })
        ).toBe('Last 15 minutes');
    });

    it('formats a relative "next N unit" window', () => {
        expect(
            prettyDuration('now', 'now+2h', { commonlyUsedRanges: [], dateFormat, now: NOW })
        ).toBe('Next 2 hours');
    });

    it('pluralizes singular counts correctly', () => {
        expect(
            prettyDuration('now-1m', 'now', { commonlyUsedRanges: [], dateFormat, now: NOW })
        ).toBe('Last 1 minute');
    });

    it('falls back to a formatted absolute range when nothing else matches', () => {
        const start = '2020-01-01T00:00:00.000Z';
        const end = '2020-01-02T00:00:00.000Z';
        const result = prettyDuration(start, end, { commonlyUsedRanges: [], dateFormat, now: NOW });
        expect(result).toBe(
            `${DateTime.fromISO(start).toFormat(dateFormat)} to ${DateTime.fromISO(end, {}).toFormat(dateFormat)}`
        );
    });
});

describe('showPrettyDuration', () => {
    it('is true when the range matches a commonly-used range', () => {
        expect(showPrettyDuration('now/d', 'now/d', commonDurationRanges)).toBe(true);
    });

    it('is true when the range is relative to now', () => {
        expect(showPrettyDuration('now-15m', 'now', [])).toBe(true);
    });

    it('is false for two absolute dates not in the commonly-used list', () => {
        expect(
            showPrettyDuration('2020-01-01T00:00:00.000Z', '2020-01-02T00:00:00.000Z', [])
        ).toBe(false);
    });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
npx vitest run src/pretty-duration.test.ts
```
Expected: FAIL - module does not exist yet.

- [ ] **Step 3: Implement `pretty-duration.ts`**

```ts
import { DateTime } from 'luxon';
import { DATE_MODES, getDateMode, INVALID_DATE, isRelativeToNow, parse, parseRelativeParts } from './date-math';
import type { DurationRange, RelativeParts, ShortDate, TimeUnitAllId } from './types';

const RELATIVE_DURATION_LABELS: Record<TimeUnitAllId, (count: number) => string> = {
    s: (count) => `Last ${count} second${count === 1 ? '' : 's'}`,
    's+': (count) => `Next ${count} second${count === 1 ? '' : 's'}`,
    m: (count) => `Last ${count} minute${count === 1 ? '' : 's'}`,
    'm+': (count) => `Next ${count} minute${count === 1 ? '' : 's'}`,
    h: (count) => `Last ${count} hour${count === 1 ? '' : 's'}`,
    'h+': (count) => `Next ${count} hour${count === 1 ? '' : 's'}`,
    d: (count) => `Last ${count} day${count === 1 ? '' : 's'}`,
    'd+': (count) => `Next ${count} day${count === 1 ? '' : 's'}`,
    w: (count) => `Last ${count} week${count === 1 ? '' : 's'}`,
    'w+': (count) => `Next ${count} week${count === 1 ? '' : 's'}`,
    M: (count) => `Last ${count} month${count === 1 ? '' : 's'}`,
    'M+': (count) => `Next ${count} month${count === 1 ? '' : 's'}`,
    y: (count) => `Last ${count} year${count === 1 ? '' : 's'}`,
    'y+': (count) => `Next ${count} year${count === 1 ? '' : 's'}`
};

const ROUNDED_LABELS: Record<string, string> = {
    s: 'second',
    m: 'minute',
    h: 'hour',
    d: 'day',
    w: 'week',
    M: 'month',
    y: 'year'
};

function hasRangeMatch(timeFrom: ShortDate, timeTo: ShortDate, ranges: DurationRange[]) {
    return ranges.find(({ start, end }) => timeFrom === start && timeTo === end);
}

export function showPrettyDuration(
    timeFrom: ShortDate,
    timeTo: ShortDate,
    quickRanges: DurationRange[]
): boolean {
    if (hasRangeMatch(timeFrom, timeTo, quickRanges)) return true;
    return isRelativeToNow(timeFrom, timeTo);
}

function formatTimeString(
    timeString: ShortDate,
    dateFormat: string,
    opts: { roundUp?: boolean; now?: DateTime } = {}
): string {
    if (timeString === 'now') return 'now';

    const parsed = parse(timeString, opts);
    if (!parsed || !parsed.isValid) return INVALID_DATE;

    return parsed.toFormat(dateFormat);
}

export function prettyDuration(
    timeFrom: ShortDate,
    timeTo: ShortDate,
    opts: { commonlyUsedRanges: DurationRange[]; dateFormat: string; now?: DateTime }
): string {
    const { commonlyUsedRanges, dateFormat, now } = opts;

    const matchingQuickRange = hasRangeMatch(timeFrom, timeTo, commonlyUsedRanges);
    if (matchingQuickRange?.label) {
        return matchingQuickRange.label;
    }

    if (isRelativeToNow(timeFrom, timeTo)) {
        const relativeParts: RelativeParts =
            getDateMode(timeTo) === DATE_MODES.NOW
                ? parseRelativeParts(timeFrom, now)
                : parseRelativeParts(timeTo, now);

        const label = RELATIVE_DURATION_LABELS[relativeParts.unit as TimeUnitAllId]?.(
            relativeParts.count
        );

        if (label) {
            if (relativeParts.round && relativeParts.roundUnit) {
                return `${label} rounded to the ${ROUNDED_LABELS[relativeParts.roundUnit]}`;
            }
            return label;
        }
    }

    const displayFrom = formatTimeString(timeFrom, dateFormat, { now });
    const displayTo = formatTimeString(timeTo, dateFormat, { roundUp: true, now });
    return `${displayFrom} to ${displayTo}`;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
npx vitest run src/pretty-duration.test.ts
```
Expected: all tests PASS.

- [ ] **Step 5: Lint and format**

```bash
npm run lint
npm run prettier:fix
```

- [ ] **Step 6: Commit**

```bash
git add packages/svelte-super-date-picker/src/pretty-duration.ts packages/svelte-super-date-picker/src/pretty-duration.test.ts
git commit -m "Add pretty-duration module"
```

---

### Task 8: `async-interval.ts` - self-rescheduling refresh timer

Direct port of `async_interval.ts` (no moment/React dependency to remove - already framework-agnostic).

**Files:**
- Create: `packages/svelte-super-date-picker/src/async-interval.ts`
- Create: `packages/svelte-super-date-picker/src/async-interval.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AsyncInterval } from './async-interval';

describe('AsyncInterval', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('calls fn once per interval and reschedules itself', async () => {
        const fn = vi.fn().mockResolvedValue(undefined);
        new AsyncInterval(fn, 1000);

        expect(fn).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1000);
        expect(fn).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1000);
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('stops rescheduling once stop() is called', async () => {
        const fn = vi.fn().mockResolvedValue(undefined);
        const interval = new AsyncInterval(fn, 1000);

        await vi.advanceTimersByTimeAsync(1000);
        expect(fn).toHaveBeenCalledTimes(1);

        interval.stop();

        await vi.advanceTimersByTimeAsync(5000);
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
npx vitest run src/async-interval.test.ts
```
Expected: FAIL - module does not exist yet.

- [ ] **Step 3: Implement `async-interval.ts`**

```ts
export class AsyncInterval {
    private timeoutId: ReturnType<typeof setTimeout> | null = null;
    private isStopped = false;

    constructor(fn: () => Promise<void> | void, refreshInterval: number) {
        this.scheduleNext(fn, refreshInterval);
    }

    private scheduleNext = (fn: () => Promise<void> | void, milliseconds: number) => {
        if (this.isStopped) return;
        this.timeoutId = setTimeout(async () => {
            await fn();
            this.scheduleNext(fn, milliseconds);
        }, milliseconds);
    };

    stop = () => {
        this.isStopped = true;
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId);
        }
    };
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
npx vitest run src/async-interval.test.ts
```
Expected: all tests PASS.

- [ ] **Step 5: Lint and format**

```bash
npm run lint
npm run prettier:fix
```

- [ ] **Step 6: Commit**

```bash
git add packages/svelte-super-date-picker/src/async-interval.ts packages/svelte-super-date-picker/src/async-interval.test.ts
git commit -m "Add async-interval module"
```

---

### Task 9: `QuickSelectPanel.svelte` - shared fieldset wrapper

The generic bordered/titled section wrapper reused by the quick-select, commonly-used, recently-used
and refresh-interval panels (ports `quick_select_panel.tsx`).

**Files:**
- Create: `packages/svelte-super-date-picker/src/components/QuickSelectPanel.svelte`

- [ ] **Step 1: Write the component**

```svelte
<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        title?: string;
        children: Snippet;
    }
    const { title, children }: Props = $props();
</script>

<fieldset class="quick-select-panel">
    {#if title}
        <legend>{title}</legend>
    {/if}
    {@render children()}
</fieldset>

<style>
    .quick-select-panel {
        border: none;
        padding: 0;
        margin: 0 0 12px 0;
    }

    .quick-select-panel legend {
        font-size: 0.8rem;
        font-weight: bold;
        color: var(--nc-tx-2);
        text-transform: uppercase;
        padding: 0;
        margin-bottom: 6px;
    }
</style>
```

- [ ] **Step 2: Verify with svelte-check**

Run from `packages/svelte-super-date-picker/`:
```bash
npx svelte-check --tsconfig ./tsconfig.json
```
Expected: no errors (unused-component warning is fine at this point since nothing imports it yet).

- [ ] **Step 3: Commit**

```bash
git add packages/svelte-super-date-picker/src/components/QuickSelectPanel.svelte
git commit -m "Add QuickSelectPanel component"
```

---

### Task 10: `CommonlyUsedRanges.svelte` and `RecentlyUsedRanges.svelte`

Ports `commonly_used_time_ranges.tsx` and `recently_used.tsx`.

**Files:**
- Create: `packages/svelte-super-date-picker/src/components/CommonlyUsedRanges.svelte`
- Create: `packages/svelte-super-date-picker/src/components/RecentlyUsedRanges.svelte`

- [ ] **Step 1: Write `CommonlyUsedRanges.svelte`**

```svelte
<script lang="ts">
    import QuickSelectPanel from './QuickSelectPanel.svelte';
    import type { DurationRange } from '../types';

    interface Props {
        commonlyUsedRanges: DurationRange[];
        onApply: (range: DurationRange) => void;
    }
    const { commonlyUsedRanges, onApply }: Props = $props();
</script>

<QuickSelectPanel title="Commonly used">
    <ul class="range-grid">
        {#each commonlyUsedRanges as range (range.label)}
            <li>
                <button type="button" class="range-link" onclick={() => onApply(range)}>
                    {range.label}
                </button>
            </li>
        {/each}
    </ul>
</QuickSelectPanel>

<style>
    .range-grid {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px 16px;
    }

    .range-link {
        background: none;
        border: none;
        padding: 0;
        color: var(--nc-lk-1);
        cursor: pointer;
        text-align: left;
        font-size: 0.9rem;
    }

    .range-link:hover {
        text-decoration: underline;
    }
</style>
```

- [ ] **Step 2: Write `RecentlyUsedRanges.svelte`**

```svelte
<script lang="ts">
    import QuickSelectPanel from './QuickSelectPanel.svelte';
    import { prettyDuration } from '../pretty-duration';
    import type { DurationRange } from '../types';

    interface Props {
        recentlyUsedRanges: DurationRange[];
        commonlyUsedRanges: DurationRange[];
        dateFormat: string;
        onApply: (range: DurationRange) => void;
    }
    const { recentlyUsedRanges, commonlyUsedRanges, dateFormat, onApply }: Props = $props();
</script>

{#if recentlyUsedRanges.length > 0}
    <QuickSelectPanel title="Recently used date ranges">
        <ul class="range-list">
            {#each recentlyUsedRanges as range (`${range.start}-${range.end}`)}
                <li>
                    <button type="button" class="range-link" onclick={() => onApply(range)}>
                        {prettyDuration(range.start, range.end, {
                            commonlyUsedRanges,
                            dateFormat
                        })}
                    </button>
                </li>
            {/each}
        </ul>
    </QuickSelectPanel>
{/if}

<style>
    .range-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .range-link {
        background: none;
        border: none;
        padding: 0;
        color: var(--nc-lk-1);
        cursor: pointer;
        text-align: left;
        font-size: 0.9rem;
    }

    .range-link:hover {
        text-decoration: underline;
    }
</style>
```

- [ ] **Step 3: Verify with svelte-check**

```bash
npx svelte-check --tsconfig ./tsconfig.json
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/svelte-super-date-picker/src/components/CommonlyUsedRanges.svelte packages/svelte-super-date-picker/src/components/RecentlyUsedRanges.svelte
git commit -m "Add CommonlyUsedRanges and RecentlyUsedRanges components"
```

---

### Task 11: `QuickSelect.svelte` - "Last/Next N units" selector

Ports `quick_select.tsx` (state, prev/next stepping, apply). Uses `parseTimeParts` from Task 5.

**Files:**
- Create: `packages/svelte-super-date-picker/src/components/QuickSelect.svelte`

- [ ] **Step 1: Write the component**

```svelte
<script lang="ts">
    import { DateTime } from 'luxon';
    import QuickSelectPanel from './QuickSelectPanel.svelte';
    import { parse } from '../date-math';
    import { parseTimeParts } from '../quick-select-utils';
    import { timeTenseOptions, timeUnitsOptions } from '../time-options';
    import type { DurationRange, TimeUnitId } from '../types';

    interface Props {
        start: string;
        end: string;
        onApply: (range: DurationRange) => void;
    }
    const { start, end, onApply }: Props = $props();

    const initial = parseTimeParts(start, end);
    let timeTense = $state<'last' | 'next'>(initial.timeTense);
    let timeValue = $state(initial.timeValue);
    let timeUnits = $state<TimeUnitId>(initial.timeUnits);

    const applyQuickSelect = () => {
        if (timeTense === 'next') {
            onApply({ start: 'now', end: `now+${timeValue}${timeUnits}` });
            return;
        }
        onApply({ start: `now-${timeValue}${timeUnits}`, end: 'now' });
    };

    const getBounds = () => {
        const min = parse(start) ?? DateTime.now().minus({ minutes: 15 });
        const max = parse(end, { roundUp: true }) ?? DateTime.now();
        return { min, max };
    };

    const stepBackward = () => {
        const { min, max } = getBounds();
        const diffMs = max.diff(min).as('milliseconds');
        onApply({
            start: min.minus({ milliseconds: diffMs }).toISO() as string,
            end: min.toISO() as string
        });
    };

    const stepForward = () => {
        const { min, max } = getBounds();
        const diffMs = max.diff(min).as('milliseconds');
        onApply({
            start: max.toISO() as string,
            end: max.plus({ milliseconds: diffMs }).toISO() as string
        });
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Enter') applyQuickSelect();
    };
</script>

<QuickSelectPanel title="Quick select">
    <div class="quick-select__steppers">
        <button type="button" aria-label="Previous time window" onclick={stepBackward}>‹</button>
        <button type="button" aria-label="Next time window" onclick={stepForward}>›</button>
    </div>
    <div class="quick-select__row">
        <select bind:value={timeTense} onkeydown={handleKeydown} aria-label="Time tense">
            {#each timeTenseOptions as option (option.value)}
                <option value={option.value}>{option.text}</option>
            {/each}
        </select>
        <input
            type="number"
            min="1"
            bind:value={timeValue}
            onkeydown={handleKeydown}
            aria-label="Time value"
        />
        <select bind:value={timeUnits} onkeydown={handleKeydown} aria-label="Time unit">
            {#each timeUnitsOptions as option (option.value)}
                <option value={option.value}>{option.text}</option>
            {/each}
        </select>
        <button type="button" disabled={timeValue <= 0} onclick={applyQuickSelect}>Apply</button>
    </div>
</QuickSelectPanel>

<style>
    .quick-select__steppers {
        display: flex;
        justify-content: flex-end;
        gap: 4px;
        margin-bottom: 4px;
    }

    .quick-select__row {
        display: flex;
        gap: 6px;
        align-items: center;
    }

    .quick-select__row input[type='number'] {
        width: 4rem;
    }
</style>
```

- [ ] **Step 2: Verify with svelte-check**

```bash
npx svelte-check --tsconfig ./tsconfig.json
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/svelte-super-date-picker/src/components/QuickSelect.svelte
git commit -m "Add QuickSelect component"
```

---

### Task 12: `RefreshIntervalControl.svelte`

Ports `refresh_interval.tsx`, using `fromMilliseconds`/`toMilliseconds`/`getMinInterval` from Task 6.

**Files:**
- Create: `packages/svelte-super-date-picker/src/components/RefreshIntervalControl.svelte`

- [ ] **Step 1: Write the component**

```svelte
<script lang="ts">
    import QuickSelectPanel from './QuickSelectPanel.svelte';
    import { fromMilliseconds, getMinInterval, toMilliseconds } from '../refresh-interval-utils';
    import { refreshUnitsOptions } from '../time-options';
    import type { Milliseconds, OnRefreshChangeProps, RefreshUnitsOptions } from '../types';

    interface Props {
        isPaused: boolean;
        refreshInterval: Milliseconds;
        minInterval?: Milliseconds;
        intervalUnits?: RefreshUnitsOptions;
        onRefreshChange: (props: OnRefreshChangeProps) => void;
    }
    const { isPaused, refreshInterval, minInterval = 0, intervalUnits, onRefreshChange }: Props =
        $props();

    const initial = fromMilliseconds(refreshInterval, intervalUnits);
    let value = $state<number | ''>(initial.value);
    let units = $state<RefreshUnitsOptions>(initial.units);
    let min = $derived(getMinInterval(minInterval, units));

    const apply = () => {
        if (value === '') return;
        const refreshIntervalMs = Math.max(toMilliseconds(units, value), minInterval || 0);
        onRefreshChange({
            refreshInterval: refreshIntervalMs,
            intervalUnits: units,
            isPaused: refreshIntervalMs <= 0 ? true : isPaused
        });
    };

    const onValueInput = (event: Event) => {
        const raw = parseFloat((event.target as HTMLInputElement).value);
        value = isNaN(raw) ? '' : raw;
        apply();
    };

    const onUnitsChange = () => {
        apply();
    };

    const toggle = () => {
        if (value === '') return;
        onRefreshChange({
            refreshInterval: toMilliseconds(units, value),
            intervalUnits: units,
            isPaused: !isPaused
        });
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Enter') toggle();
    };
</script>

<QuickSelectPanel>
    <div class="refresh-interval">
        <label class="refresh-interval__toggle">
            <input type="checkbox" checked={!isPaused} onchange={toggle} />
            Refresh every
        </label>
        <input
            type="number"
            min={min}
            value={value}
            disabled={isPaused}
            oninput={onValueInput}
            onkeydown={handleKeydown}
            aria-label="Refresh interval value"
        />
        <select
            bind:value={units}
            disabled={isPaused}
            onchange={onUnitsChange}
            onkeydown={handleKeydown}
            aria-label="Refresh interval units"
        >
            {#each refreshUnitsOptions as option (option.value)}
                <option value={option.value}>{option.text}</option>
            {/each}
        </select>
    </div>
</QuickSelectPanel>

<style>
    .refresh-interval {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .refresh-interval__toggle {
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
    }

    .refresh-interval input[type='number'] {
        width: 4rem;
    }
</style>
```

- [ ] **Step 2: Verify with svelte-check**

```bash
npx svelte-check --tsconfig ./tsconfig.json
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/svelte-super-date-picker/src/components/RefreshIntervalControl.svelte
git commit -m "Add RefreshIntervalControl component"
```

---

### Task 13: `QuickSelectPopover.svelte`

Combines Tasks 9-12 behind a toggle button (ports `quick_select_popover.tsx`). Uses a local
click-outside handler (no such utility exists elsewhere in `front` to reuse).

**Files:**
- Create: `packages/svelte-super-date-picker/src/components/QuickSelectPopover.svelte`

- [ ] **Step 1: Write the component**

```svelte
<script lang="ts">
    import QuickSelect from './QuickSelect.svelte';
    import CommonlyUsedRanges from './CommonlyUsedRanges.svelte';
    import RecentlyUsedRanges from './RecentlyUsedRanges.svelte';
    import RefreshIntervalControl from './RefreshIntervalControl.svelte';
    import type { DurationRange, Milliseconds, OnRefreshChangeProps, RefreshUnitsOptions } from '../types';

    interface Props {
        start: string;
        end: string;
        dateFormat: string;
        commonlyUsedRanges: DurationRange[];
        recentlyUsedRanges: DurationRange[];
        isDisabled: boolean;
        isPaused: boolean;
        refreshInterval: Milliseconds;
        refreshMinInterval?: Milliseconds;
        refreshIntervalUnits?: RefreshUnitsOptions;
        showRefreshInterval: boolean;
        onApplyTime: (range: DurationRange) => void;
        onRefreshChange?: (props: OnRefreshChangeProps) => void;
    }
    const {
        start,
        end,
        dateFormat,
        commonlyUsedRanges,
        recentlyUsedRanges,
        isDisabled,
        isPaused,
        refreshInterval,
        refreshMinInterval,
        refreshIntervalUnits,
        showRefreshInterval,
        onApplyTime,
        onRefreshChange
    }: Props = $props();

    let isOpen = $state(false);
    let containerEl: HTMLDivElement;

    const closePopover = () => {
        isOpen = false;
    };

    const togglePopover = () => {
        isOpen = !isOpen;
    };

    const applyTime = (range: DurationRange) => {
        onApplyTime(range);
        closePopover();
    };

    const handleWindowClick = (event: MouseEvent) => {
        if (isOpen && containerEl && !containerEl.contains(event.target as Node)) {
            closePopover();
        }
    };
</script>

<svelte:window onclick={handleWindowClick} />

<div class="quick-select-popover" bind:this={containerEl}>
    <button
        type="button"
        class="quick-select-popover__toggle"
        disabled={isDisabled}
        onclick={togglePopover}
        aria-label="Date quick select"
    >
        <i class="far fa-calendar-alt"></i>
        <i class="fas fa-caret-down"></i>
    </button>

    {#if isOpen}
        <div class="quick-select-popover__panel">
            <QuickSelect {start} {end} onApply={applyTime} />
            <CommonlyUsedRanges {commonlyUsedRanges} onApply={applyTime} />
            <RecentlyUsedRanges {recentlyUsedRanges} {commonlyUsedRanges} {dateFormat} onApply={applyTime} />
            {#if showRefreshInterval && onRefreshChange}
                <RefreshIntervalControl
                    {isPaused}
                    {refreshInterval}
                    minInterval={refreshMinInterval}
                    intervalUnits={refreshIntervalUnits}
                    {onRefreshChange}
                />
            {/if}
        </div>
    {/if}
</div>

<style>
    .quick-select-popover {
        position: relative;
    }

    .quick-select-popover__toggle {
        display: flex;
        align-items: center;
        gap: 4px;
        height: 100%;
        padding: 0 8px;
        background: var(--nc-bg-2);
        border: 1px solid var(--nc-bg-3);
        color: var(--nc-tx-1);
        cursor: pointer;
    }

    .quick-select-popover__panel {
        position: absolute;
        z-index: 10;
        top: 100%;
        left: 0;
        margin-top: 4px;
        padding: 12px;
        min-width: 20rem;
        background: var(--nc-bg-1);
        border: 1px solid var(--nc-bg-3);
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
</style>
```

- [ ] **Step 2: Verify with svelte-check**

```bash
npx svelte-check --tsconfig ./tsconfig.json
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/svelte-super-date-picker/src/components/QuickSelectPopover.svelte
git commit -m "Add QuickSelectPopover component"
```

---

### Task 14: `AbsoluteTab.svelte` and `RelativeTab.svelte`

Per the design decision, absolute date entry uses a native `<input type="datetime-local">`
instead of a custom inline calendar (ports the essential behavior of `absolute_tab.tsx` and
`relative_tab.tsx`, dropping the calendar widget and free-text-paste parsing).

**Files:**
- Create: `packages/svelte-super-date-picker/src/components/AbsoluteTab.svelte`
- Create: `packages/svelte-super-date-picker/src/components/RelativeTab.svelte`

- [ ] **Step 1: Write `AbsoluteTab.svelte`**

```svelte
<script lang="ts">
    import { DateTime } from 'luxon';
    import { parse } from '../date-math';
    import type { ShortDate } from '../types';

    interface Props {
        value: ShortDate;
        roundUp?: boolean;
        onChange: (value: ShortDate) => void;
    }
    const { value, roundUp = false, onChange }: Props = $props();

    const toInputValue = (v: ShortDate) => {
        const parsed = parse(v, { roundUp });
        return parsed && parsed.isValid ? parsed.toFormat("yyyy-MM-dd'T'HH:mm:ss") : '';
    };

    let inputValue = $state(toInputValue(value));

    const handleChange = () => {
        const parsed = DateTime.fromISO(inputValue);
        if (!parsed.isValid) return;
        onChange(parsed.toISO() as string);
    };
</script>

<label class="absolute-tab">
    <span>Absolute date</span>
    <input type="datetime-local" step="1" bind:value={inputValue} onchange={handleChange} />
</label>

<style>
    .absolute-tab {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px;
    }
</style>
```

- [ ] **Step 2: Write `RelativeTab.svelte`**

```svelte
<script lang="ts">
    import { parse, parseRelativeParts, toRelativeStringFromParts } from '../date-math';
    import { relativeOptions, relativeRoundingLabels } from '../time-options';
    import type { ShortDate, TimeUnitId } from '../types';

    interface Props {
        value: ShortDate;
        roundUp?: boolean;
        dateFormat: string;
        onChange: (value: ShortDate) => void;
    }
    const { value, roundUp = false, dateFormat, onChange }: Props = $props();

    const initial = parseRelativeParts(value);
    let count = $state<number | undefined>(initial.count);
    let unit = $state(initial.unit);
    let round = $state(initial.round);
    const roundUnit = initial.roundUnit;

    const emit = () => {
        if (count === undefined || count < 0) return;
        onChange(toRelativeStringFromParts({ count, unit, round, roundUnit }));
    };

    const onCountInput = (event: Event) => {
        const raw = parseInt((event.target as HTMLInputElement).value, 10);
        count = isNaN(raw) ? undefined : raw;
        emit();
    };

    let formattedValue = $derived.by(() => {
        const parsed = parse(value, { roundUp });
        return parsed && parsed.isValid ? parsed.toFormat(dateFormat) : '';
    });
</script>

<div class="relative-tab">
    <div class="relative-tab__row">
        <input
            type="number"
            min="0"
            value={count}
            oninput={onCountInput}
            aria-label="Time span amount"
        />
        <select bind:value={unit} onchange={emit} aria-label="Relative time span">
            {#each relativeOptions as option (option.value)}
                <option value={option.value}>{option.text}</option>
            {/each}
        </select>
    </div>
    <input type="text" value={formattedValue} readonly aria-label="Resolved date" />
    <label class="relative-tab__round">
        <input type="checkbox" bind:checked={round} onchange={emit} />
        {relativeRoundingLabels[unit.replace('+', '') as TimeUnitId]}
    </label>
</div>

<style>
    .relative-tab {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px;
    }

    .relative-tab__row {
        display: flex;
        gap: 6px;
    }

    .relative-tab__row input[type='number'] {
        width: 4rem;
    }

    .relative-tab__round {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.85rem;
    }
</style>
```

- [ ] **Step 3: Verify with svelte-check**

```bash
npx svelte-check --tsconfig ./tsconfig.json
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/svelte-super-date-picker/src/components/AbsoluteTab.svelte packages/svelte-super-date-picker/src/components/RelativeTab.svelte
git commit -m "Add AbsoluteTab and RelativeTab components"
```

---

### Task 15: `DatePopoverButton.svelte`

Per-side (start/end) button + popover with Absolute/Relative tab switcher (ports
`date_popover_button.tsx` + `date_popover_content.tsx`). Manages its own open state internally
(a deliberate simplification vs. EUI's externally-controlled popover state).

**Files:**
- Create: `packages/svelte-super-date-picker/src/components/DatePopoverButton.svelte`

- [ ] **Step 1: Write the component**

```svelte
<script lang="ts">
    import { getDateMode } from '../date-math';
    import { prettyDuration } from '../pretty-duration';
    import AbsoluteTab from './AbsoluteTab.svelte';
    import RelativeTab from './RelativeTab.svelte';
    import type { ShortDate } from '../types';

    interface Props {
        value: ShortDate;
        roundUp?: boolean;
        dateFormat: string;
        isInvalid: boolean;
        isDisabled: boolean;
        onChange: (value: ShortDate) => void;
    }
    const { value, roundUp = false, dateFormat, isInvalid, isDisabled, onChange }: Props = $props();

    let isOpen = $state(false);
    let activeTab = $state<'absolute' | 'relative'>(
        getDateMode(value) === 'absolute' ? 'absolute' : 'relative'
    );
    let containerEl: HTMLDivElement;

    const label = $derived(
        value === 'now' ? 'now' : prettyDuration(value, 'now', { commonlyUsedRanges: [], dateFormat })
    );

    const closePopover = () => {
        isOpen = false;
    };

    const togglePopover = () => {
        isOpen = !isOpen;
    };

    const handleChange = (nextValue: ShortDate) => {
        onChange(nextValue);
    };

    const handleWindowClick = (event: MouseEvent) => {
        if (isOpen && containerEl && !containerEl.contains(event.target as Node)) {
            closePopover();
        }
    };
</script>

<svelte:window onclick={handleWindowClick} />

<div class="date-popover-button" bind:this={containerEl}>
    <button
        type="button"
        class="date-popover-button__toggle"
        class:date-popover-button__toggle--invalid={isInvalid}
        disabled={isDisabled}
        onclick={togglePopover}
    >
        {label}
    </button>

    {#if isOpen}
        <div class="date-popover-button__panel">
            <div class="date-popover-button__tabs">
                <button
                    type="button"
                    class:active={activeTab === 'absolute'}
                    onclick={() => (activeTab = 'absolute')}
                >
                    Absolute
                </button>
                <button
                    type="button"
                    class:active={activeTab === 'relative'}
                    onclick={() => (activeTab = 'relative')}
                >
                    Relative
                </button>
            </div>
            {#if activeTab === 'absolute'}
                <AbsoluteTab {value} {roundUp} onChange={handleChange} />
            {:else}
                <RelativeTab {value} {roundUp} {dateFormat} onChange={handleChange} />
            {/if}
        </div>
    {/if}
</div>

<style>
    .date-popover-button {
        position: relative;
        flex: 1;
    }

    .date-popover-button__toggle {
        width: 100%;
        text-align: left;
        padding: 6px 10px;
        background: var(--nc-bg-2);
        border: 1px solid var(--nc-bg-3);
        color: var(--nc-tx-1);
        cursor: pointer;
    }

    .date-popover-button__toggle--invalid {
        border-color: var(--nc-error);
        color: var(--nc-error);
    }

    .date-popover-button__panel {
        position: absolute;
        z-index: 10;
        top: 100%;
        margin-top: 4px;
        min-width: 18rem;
        background: var(--nc-bg-1);
        border: 1px solid var(--nc-bg-3);
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .date-popover-button__tabs {
        display: flex;
        border-bottom: 1px solid var(--nc-bg-3);
    }

    .date-popover-button__tabs button {
        flex: 1;
        padding: 6px;
        background: none;
        border: none;
        color: var(--nc-tx-2);
        cursor: pointer;
    }

    .date-popover-button__tabs button.active {
        color: var(--nc-tx-1);
        border-bottom: 2px solid var(--nc-ac-1);
    }
</style>
```

- [ ] **Step 2: Verify with svelte-check**

```bash
npx svelte-check --tsconfig ./tsconfig.json
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/svelte-super-date-picker/src/components/DatePopoverButton.svelte
git commit -m "Add DatePopoverButton component"
```

---

### Task 16: `UpdateButton.svelte`

Ports `super_update_button.tsx`'s state logic (needsUpdate/isLoading -> label/color), dropping the
tooltip-with-auto-hide behavior (not essential, adds complexity for no functional gain here).

**Files:**
- Create: `packages/svelte-super-date-picker/src/components/UpdateButton.svelte`

- [ ] **Step 1: Write the component**

```svelte
<script lang="ts">
    interface Props {
        needsUpdate: boolean;
        isLoading: boolean;
        isDisabled: boolean;
        onClick: () => void;
    }
    const { needsUpdate, isLoading, isDisabled, onClick }: Props = $props();

    const label = $derived(isLoading ? 'Updating' : needsUpdate ? 'Update' : 'Refresh');
</script>

<button
    type="button"
    class="update-button"
    class:update-button--needs-update={needsUpdate || isLoading}
    disabled={isDisabled}
    onclick={onClick}
>
    <i class="fas {needsUpdate || isLoading ? 'fa-play' : 'fa-sync-alt'}"></i>
    {label}
</button>

<style>
    .update-button {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: var(--nc-ac-1);
        color: var(--nc-ac-tx);
        border: none;
        cursor: pointer;
    }

    .update-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
```

- [ ] **Step 2: Verify with svelte-check**

```bash
npx svelte-check --tsconfig ./tsconfig.json
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/svelte-super-date-picker/src/components/UpdateButton.svelte
git commit -m "Add UpdateButton component"
```

---

### Task 17: `SuperDatePicker.svelte` - top-level component

Wires everything together: state, the async refresh interval, the collapsed "pretty duration"
display vs. the expanded start/end popovers, and the update button. Ports the class-component
logic from `super_date_picker.tsx` into Svelte 5 runes.

**Files:**
- Create: `packages/svelte-super-date-picker/src/SuperDatePicker.svelte`

- [ ] **Step 1: Write the component**

```svelte
<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { AsyncInterval } from './async-interval';
    import { parse } from './date-math';
    import { prettyDuration, showPrettyDuration } from './pretty-duration';
    import { commonDurationRanges } from './time-options';
    import QuickSelectPopover from './components/QuickSelectPopover.svelte';
    import DatePopoverButton from './components/DatePopoverButton.svelte';
    import UpdateButton from './components/UpdateButton.svelte';
    import type {
        DurationRange,
        Milliseconds,
        OnRefreshChangeProps,
        OnRefreshProps,
        OnTimeChangeProps,
        RefreshUnitsOptions,
        ShortDate
    } from './types';

    interface Props {
        start?: ShortDate;
        end?: ShortDate;
        onTimeChange: (props: OnTimeChangeProps) => void;
        onRefresh?: (props: OnRefreshProps) => void;
        onRefreshChange?: (props: OnRefreshChangeProps) => void;
        isPaused?: boolean;
        refreshInterval?: Milliseconds;
        refreshMinInterval?: Milliseconds;
        refreshIntervalUnits?: RefreshUnitsOptions;
        commonlyUsedRanges?: DurationRange[];
        recentlyUsedRanges?: DurationRange[];
        showUpdateButton?: boolean;
        dateFormat?: string;
        isDisabled?: boolean;
    }
    const {
        start: startProp = 'now-15m',
        end: endProp = 'now',
        onTimeChange,
        onRefresh,
        onRefreshChange,
        isPaused = true,
        refreshInterval = 1000,
        refreshMinInterval,
        refreshIntervalUnits,
        commonlyUsedRanges = commonDurationRanges,
        recentlyUsedRanges = [],
        showUpdateButton = true,
        dateFormat = "MMM d, yyyy @ HH:mm:ss",
        isDisabled = false
    }: Props = $props();

    let start = $state(startProp);
    let end = $state(endProp);
    let hasChanged = $state(false);

    const isInvalid = $derived.by(() => {
        if (start === 'now' && end === 'now') return true;
        const startParsed = parse(start);
        const endParsed = parse(end, { roundUp: true });
        if (!startParsed || !endParsed) return true;
        return startParsed > endParsed;
    });

    let showPretty = $state(showPrettyDuration(startProp, endProp, commonlyUsedRanges));

    const setRange = (range: DurationRange) => {
        start = range.start;
        end = range.end;
        hasChanged = !(range.start === startProp && range.end === endProp);
        if (!showUpdateButton) {
            onTimeChange({ start, end, isQuickSelection: false, isInvalid });
        }
    };

    const applyQuickTime = (range: DurationRange) => {
        start = range.start;
        end = range.end;
        showPretty = showPrettyDuration(range.start, range.end, commonlyUsedRanges);
        onTimeChange({ start: range.start, end: range.end, isQuickSelection: true, isInvalid: false });
    };

    const applyTime = () => {
        onTimeChange({ start, end, isQuickSelection: false, isInvalid: false });
        hasChanged = false;
    };

    const hidePrettyDuration = () => {
        showPretty = false;
    };

    const handleUpdateClick = () => {
        if (!hasChanged && onRefresh) {
            onRefresh({ start, end, refreshInterval });
        } else {
            applyTime();
        }
    };

    let asyncInterval: AsyncInterval | undefined;

    const stopInterval = () => {
        asyncInterval?.stop();
        asyncInterval = undefined;
    };

    const startInterval = (interval: Milliseconds) => {
        if (!onRefresh) return;
        asyncInterval = new AsyncInterval(() => {
            onRefresh({ start, end, refreshInterval: interval });
        }, interval);
    };

    onMount(() => {
        if (!isPaused) startInterval(refreshInterval);
    });

    $effect(() => {
        stopInterval();
        if (!isPaused) startInterval(refreshInterval);
    });

    onDestroy(stopInterval);

    const label = $derived(prettyDuration(start, end, { commonlyUsedRanges, dateFormat }));
</script>

<div class="super-date-picker" class:super-date-picker--needs-updating={hasChanged && !isInvalid}>
    <QuickSelectPopover
        {start}
        {end}
        {dateFormat}
        {commonlyUsedRanges}
        {recentlyUsedRanges}
        {isDisabled}
        {isPaused}
        {refreshInterval}
        {refreshMinInterval}
        refreshIntervalUnits={refreshIntervalUnits}
        showRefreshInterval={!!onRefreshChange}
        onApplyTime={applyQuickTime}
        onRefreshChange={onRefreshChange}
    />

    {#if showPretty}
        <button type="button" class="super-date-picker__pretty" onclick={hidePrettyDuration}>
            {label}
        </button>
    {:else}
        <DatePopoverButton
            value={start}
            dateFormat={dateFormat}
            isInvalid={isInvalid}
            isDisabled={isDisabled}
            onChange={(value) => setRange({ start: value, end })}
        />
        <span class="super-date-picker__delimiter">→</span>
        <DatePopoverButton
            value={end}
            roundUp
            dateFormat={dateFormat}
            isInvalid={isInvalid}
            isDisabled={isDisabled}
            onChange={(value) => setRange({ start, end: value })}
        />
    {/if}

    {#if showUpdateButton}
        <UpdateButton
            needsUpdate={hasChanged}
            isLoading={false}
            isDisabled={isDisabled || isInvalid}
            onClick={handleUpdateClick}
        />
    {/if}
</div>

<style>
    .super-date-picker {
        display: flex;
        align-items: stretch;
        gap: 6px;
    }

    .super-date-picker__pretty {
        flex: 1;
        text-align: left;
        padding: 6px 10px;
        background: var(--nc-bg-2);
        border: 1px solid var(--nc-bg-3);
        color: var(--nc-tx-1);
        cursor: pointer;
    }

    .super-date-picker__delimiter {
        display: flex;
        align-items: center;
        color: var(--nc-tx-2);
    }

    .super-date-picker--needs-updating .super-date-picker__pretty {
        border-color: var(--nc-ac-1);
    }
</style>
```

- [ ] **Step 2: Verify with svelte-check**

```bash
npx svelte-check --tsconfig ./tsconfig.json
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/svelte-super-date-picker/src/SuperDatePicker.svelte
git commit -m "Add top-level SuperDatePicker component"
```

---

### Task 18: `index.ts` - public exports

**Files:**
- Create: `packages/svelte-super-date-picker/src/index.ts`

- [ ] **Step 1: Write `index.ts`**

```ts
export { default as SuperDatePicker } from './SuperDatePicker.svelte';

export { parse, getDateMode, isRelativeToNow, toAbsoluteString, toRelativeString } from './date-math';
export { prettyDuration, showPrettyDuration } from './pretty-duration';
export { commonDurationRanges } from './time-options';

export type {
    DurationRange,
    Milliseconds,
    OnRefreshChangeProps,
    OnRefreshProps,
    OnTimeChangeProps,
    RefreshUnitsOptions,
    ShortDate
} from './types';
```

- [ ] **Step 2: Verify the whole package type-checks and lints**

Run from `packages/svelte-super-date-picker/`:
```bash
npx svelte-check --tsconfig ./tsconfig.json
npm run lint
npm run prettier
```
Expected: no errors.

- [ ] **Step 3: Run the full test suite**

```bash
npm run tests
```
Expected: all tests across `date-math.test.ts`, `quick-select-utils.test.ts`, `refresh-interval-utils.test.ts`, `pretty-duration.test.ts`, `async-interval.test.ts` PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/svelte-super-date-picker/src/index.ts
git commit -m "Add public exports for svelte-super-date-picker"
```

---

### Task 19: Demo route in `front`

Mounts `<SuperDatePicker>` standalone with stub callbacks, per the design's "package + isolated
demo route only" scope decision - no home-tracker page changes in this phase.

**Files:**
- Create: `front/src/routes/(noso)/svelte-super-date-picker-demo/+page.svelte`

- [ ] **Step 1: Write the demo page**

```svelte
<script lang="ts">
    import { SuperDatePicker } from 'svelte-super-date-picker';
    import type { OnRefreshProps, OnTimeChangeProps } from 'svelte-super-date-picker';

    let start = $state('now-15m');
    let end = $state('now');
    let isPaused = $state(true);
    let refreshInterval = $state(5000);
    let lastEvent = $state('');

    const handleTimeChange = (props: OnTimeChangeProps) => {
        start = props.start;
        end = props.end;
        lastEvent = `onTimeChange: ${JSON.stringify(props)}`;
        console.log('onTimeChange', props);
    };

    const handleRefresh = (props: OnRefreshProps) => {
        lastEvent = `onRefresh: ${JSON.stringify(props)}`;
        console.log('onRefresh', props);
    };

    const handleRefreshChange = (props: { isPaused: boolean; refreshInterval: number }) => {
        isPaused = props.isPaused;
        refreshInterval = props.refreshInterval;
        lastEvent = `onRefreshChange: ${JSON.stringify(props)}`;
        console.log('onRefreshChange', props);
    };
</script>

<svelte:head>
    <title>svelte-super-date-picker demo</title>
</svelte:head>

<h1>svelte-super-date-picker demo</h1>
<p>Standalone verification page for the svelte-super-date-picker package. Not linked from navigation.</p>

<SuperDatePicker
    {start}
    {end}
    {isPaused}
    {refreshInterval}
    onTimeChange={handleTimeChange}
    onRefresh={handleRefresh}
    onRefreshChange={handleRefreshChange}
/>

<pre>{lastEvent}</pre>
```

- [ ] **Step 2: Start the dev server and manually verify in the browser**

Run from `front/`:
```bash
npm run dev
```
Open `https://localhost:8080/svelte-super-date-picker-demo` (accept the self-signed cert warning) and check:
- Quick-select popover opens on click, "Commonly used" ranges apply and update the pretty-duration label
- "Last/Next N units" apply button changes the range
- Clicking the pretty-duration label switches to the two date-popover buttons
- Absolute tab's `datetime-local` input updates the value; Relative tab's count/unit/round inputs update it
- Toggling refresh-on in the quick-select popover causes `onRefresh` to log on the configured interval
- Update button shows "Update" after a pending change and "Refresh" otherwise; clicking it fires `onTimeChange`/`onRefresh`

Stop the dev server once verified (Ctrl+C).

- [ ] **Step 3: Commit**

```bash
git add "front/src/routes/(noso)/svelte-super-date-picker-demo/+page.svelte"
git commit -m "Add svelte-super-date-picker demo route"
```

---

### Task 20: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the package's full check from `packages/svelte-super-date-picker/`**

```bash
npm run check
npm run tests
npx svelte-check --tsconfig ./tsconfig.json
```
Expected: all pass with no errors.

- [ ] **Step 2: Run `front`'s full check from `front/`**

```bash
npm run check
npm run lint
npm run prettier
```
Expected: all pass with no errors (confirms the new package's `.svelte`/`.ts` files satisfy `front`'s own lint/typecheck when pulled in via the `file:` dependency).

- [ ] **Step 3: Re-confirm the demo route manually per Task 19 Step 2**

This is the final gate before considering the feature complete - re-run through the same
checklist in a fresh `npm run dev` session to confirm nothing regressed from the verification
tasks above.

- [ ] **Step 4: Report status to the user**

Summarize: package created and tested, demo route verified in-browser, home-tracker integration
intentionally deferred per the approved design scope.
