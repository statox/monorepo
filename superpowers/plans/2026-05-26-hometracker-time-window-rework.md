# HomeTracker Time Window Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed string time window enum (`'3h'`, `'1d'`, etc.) with a flexible `{ startDateMs, endDateMs }` pair across the backend API and frontend, enabling arbitrary time range queries.

**Architecture:** Backend-first approach — update types, errors, service, and route first, then regenerate the SDK, then update the frontend types, store, and components. The frontend `TimeWindowSelection` keeps its dropdown UI but converts the selected string to timestamps before calling the API.

**Tech Stack:** TypeScript, Express, Elasticsearch (`auto_date_histogram`), SvelteKit 5 (Svelte runes), Mocha/Chai/Supertest, Luxon (backend time), Svelte writable stores with localStorage persistence.

---

## File Map

**Backend — create/modify:**
- `back/src/libs/modules/homeTracker/types.ts` — add `TimeWindow` interface
- `back/src/libs/errors/codes.ts` — add `INVALID_TIME_WINDOW` error code
- `back/src/libs/modules/homeTracker/errors.ts` — add `InvalidTimeWindowError` class
- `back/src/libs/modules/logging/types.ts` — add `timewindowStartMs`, `timewindowEndMs` to `LoggableProperties`
- `back/src/libs/modules/homeTracker/services/getHistogramData.ts` — add `computeNbBuckets`, update service signature and ELK query
- `back/src/libs/routes/homeTracker/histogramData.ts` — update input schema, logging calls, `clientErrors`

**Backend — tests:**
- `back/tests/routes/homeTracker/histogramData/histogramData.test.ts` — update existing tests + add 3 new tests

**Frontend — modify:**
- `front/src/lib/HomeTracker/types.ts` — remove old string `TimeWindow`/`TimeWindowPublic`, add object `TimeWindow`
- `front/src/routes/(apps)/home-tracker/store.ts` — update store type + localStorage migration
- `front/src/routes/(apps)/home-tracker/components/TimeWindowSelection.svelte` — compute timestamps from selected string
- `front/src/routes/(apps)/home-tracker/components/SensorsHistogram.svelte` — type update only
- `front/src/routes/(apps)/home-tracker/components/SensorsSummary.svelte` — type update only

---

## Task 1: Backend foundation — types, error code, error class, logging fields

**Files:**
- Modify: `back/src/libs/modules/homeTracker/types.ts`
- Modify: `back/src/libs/errors/codes.ts`
- Modify: `back/src/libs/modules/homeTracker/errors.ts`
- Modify: `back/src/libs/modules/logging/types.ts`

These are pure type/constant changes — no runtime behaviour changes yet, no tests needed.

- [ ] **Step 1: Add `TimeWindow` interface to backend types**

In `back/src/libs/modules/homeTracker/types.ts`, add at the top (before `SensorRawData`):

```typescript
export interface TimeWindow {
    startDateMs: number;
    endDateMs: number;
}
```

- [ ] **Step 2: Add `INVALID_TIME_WINDOW` to error codes**

In `back/src/libs/errors/codes.ts`, add to the `// HomeTracker` section:

```typescript
    // HomeTracker
    'SENSOR_NOT_FOUND',
    'INVALID_TIME_WINDOW',
```

- [ ] **Step 3: Add `InvalidTimeWindowError` class**

Replace the full content of `back/src/libs/modules/homeTracker/errors.ts`:

```typescript
import { AppError } from '../../errors/AppError.js';

export class SensorNotFoundError extends AppError {
    constructor() {
        super({ code: 'SENSOR_NOT_FOUND', httpStatus: 400 });
    }
}

export class InvalidTimeWindowError extends AppError {
    constructor() {
        super({ code: 'INVALID_TIME_WINDOW', httpStatus: 400 });
    }
}
```

- [ ] **Step 4: Add logging fields**

In `back/src/libs/modules/logging/types.ts`, add to `LoggableProperties` (near the existing `timewindow?: string` field):

```typescript
    timewindow?: string;
    timewindowStartMs?: number;
    timewindowEndMs?: number;
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd back && npm run check
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add back/src/libs/modules/homeTracker/types.ts \
        back/src/libs/errors/codes.ts \
        back/src/libs/modules/homeTracker/errors.ts \
        back/src/libs/modules/logging/types.ts
git commit -m "HomeTracker - TimeWindow - Add types, error, and logging fields"
```

---

## Task 2: Write failing route tests

**Files:**
- Modify: `back/tests/routes/homeTracker/histogramData/histogramData.test.ts`

Write all updated and new tests before touching the implementation. Run to confirm they fail for the right reasons.

- [ ] **Step 1: Replace the test file content**

```typescript
import request from 'supertest';
import { app } from '../../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../../helpers/index.js';
import { DateTime } from 'luxon';

describe('/homeTracker/histogramData', () => {
    beforeEach('Flush ELK', th.elk.flush);

    it('should average the data in the same bucket', async () => {
        await th.elk.fixture({
            'data-home-tracker': [
                {
                    '@timestamp': DateTime.now().toMillis(),
                    document: {
                        sensorName: 'salon',
                        batteryCharge: 4,
                        batteryPercent: 100,
                        humidity: 30,
                        internalHumidity: 40,
                        tempCelsius: 21,
                        internalTempCelsius: 25,
                        pressurehPa: 1014
                    }
                },
                {
                    '@timestamp': DateTime.now().toMillis(),
                    document: {
                        sensorName: 'salon',
                        batteryCharge: 4,
                        batteryPercent: 100,
                        humidity: 30,
                        internalHumidity: 40,
                        tempCelsius: 22,
                        internalTempCelsius: 25,
                        pressurehPa: 1016
                    }
                },
                {
                    '@timestamp': DateTime.now().toMillis(),
                    document: {
                        sensorName: 'jardiniere',
                        batteryCharge: 4,
                        batteryPercent: 100,
                        humidity: 30,
                        tempCelsius: 22
                    }
                },
                {
                    '@timestamp': DateTime.now().toMillis(),
                    document: {
                        sensorName: 'jardiniere',
                        batteryCharge: 4,
                        batteryPercent: 100,
                        humidity: 30,
                        tempCelsius: 22
                    }
                }
            ]
        });

        const startDateMs = DateTime.now().minus({ hours: 3 }).toMillis();
        const endDateMs = DateTime.now().toMillis();

        await request(app)
            .post('/homeTracker/histogramData')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({ timeWindow: { startDateMs, endDateMs } })
            .expect(200)
            .then((response) => {
                const { histogramData, sensorNames } = response.body;

                assert.sameMembers(sensorNames, ['salon', 'jardiniere']);

                assert.lengthOf(Object.keys(histogramData), 1);

                const ts = Object.keys(histogramData)[0];
                th.time.isAroundNowSec(Number(ts));

                assert.deepEqual(histogramData[ts], {
                    tempCelsius: {
                        jardiniere: 22,
                        salon: 21.5
                    },
                    internalTempCelsius: {
                        salon: 25
                    },
                    batteryCharge: {
                        jardiniere: 4,
                        salon: 4
                    },
                    humidity: {
                        jardiniere: 30,
                        salon: 30
                    },
                    internalHumidity: {
                        salon: 40
                    },
                    pressurehPa: {
                        salon: 1015
                    }
                });
            });
    });

    it('should create buckets based on the time', async () => {
        await th.elk.fixture({
            // Create logs every 5 minutes for the past 4 hours
            'data-home-tracker': new Array(4 * 6 * 2)
                .fill(0)
                .map((_, i) =>
                    DateTime.now()
                        .minus({ minutes: 5 * i })
                        .toMillis()
                )
                .map((ts) => {
                    return {
                        '@timestamp': ts,
                        document: {
                            sensorName: 'salon',
                            batteryCharge: 2,
                            humidity: 30,
                            tempCelsius: 20
                        }
                    };
                })
        });

        const startDateMs = DateTime.now().minus({ hours: 3 }).toMillis();
        const endDateMs = DateTime.now().toMillis();

        await request(app)
            .post('/homeTracker/histogramData')
            .set('Accept', 'application/json')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send({ timeWindow: { startDateMs, endDateMs } })
            .expect(200)
            .then((response) => {
                const { histogramData } = response.body;

                // With a 3h window our formula requests 12 buckets; ELK rounds to 10min
                // intervals giving ~18 actual buckets. Accept a reasonable range.
                const nbBuckets = Object.keys(histogramData).length;
                assert.isAtLeast(nbBuckets, 10);
                assert.isAtMost(nbBuckets, 25);

                // Check that the earliest bucket is roughly 3 hours in the past
                const minTS = Math.min(...Object.keys(histogramData).map(Number));
                const minDate = DateTime.fromSeconds(minTS);
                const diff = DateTime.now().diff(minDate, 'minutes').minutes;
                assert.isAtMost(diff, 3 * 60 + 30);
                assert.isAtLeast(diff, 3 * 60 - 30);

                // Check that the latest bucket respects endDateMs
                const maxTS = Math.max(...Object.keys(histogramData).map(Number));
                const maxDate = DateTime.fromSeconds(maxTS);
                assert.isBelow(maxDate.toMillis(), endDateMs + 60_000); // within 1 min tolerance
            });
    });

    it('should exclude data outside the time window', async () => {
        const now = DateTime.now();

        await th.elk.fixture({
            'data-home-tracker': [
                {
                    // Within the window (6h ago)
                    '@timestamp': now.minus({ hours: 6 }).toMillis(),
                    document: { sensorName: 'salon', tempCelsius: 20 }
                },
                {
                    // After endDateMs (now) — should be excluded
                    '@timestamp': now.toMillis(),
                    document: { sensorName: 'salon', tempCelsius: 99 }
                }
            ]
        });

        const startDateMs = now.minus({ hours: 12 }).toMillis();
        const endDateMs = now.minus({ hours: 3 }).toMillis();

        await request(app)
            .post('/homeTracker/histogramData')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({ timeWindow: { startDateMs, endDateMs } })
            .expect(200)
            .then((response) => {
                const { histogramData, sensorNames } = response.body;

                // Only the 6h-ago record is in the window; the current-time record is excluded
                assert.sameMembers(sensorNames, ['salon']);
                const allTemps = Object.values(histogramData as Record<string, { tempCelsius?: Record<string, number> }>)
                    .flatMap((bucket) => Object.values(bucket.tempCelsius ?? {}));
                assert.notInclude(allTemps, 99, 'data after endDateMs must be excluded');
            });
    });

    it('should return INVALID_TIME_WINDOW when startDateMs >= endDateMs', async () => {
        const now = Date.now();

        await request(app)
            .post('/homeTracker/histogramData')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({ timeWindow: { startDateMs: now, endDateMs: now - 1000 } })
            .expect(400)
            .then((response) => {
                assert.equal(response.body.code, 'INVALID_TIME_WINDOW');
            });
    });
});
```

- [ ] **Step 2: Run the tests to confirm they all fail**

```bash
cd back && npm run tests -- -f 'homeTracker/histogramData'
```

Expected: all 4 tests FAIL (route currently rejects the new `timeWindow` shape with 400 input validation error).

- [ ] **Step 3: Commit failing tests**

```bash
git add back/tests/routes/homeTracker/histogramData/histogramData.test.ts
git commit -m "HomeTracker - TimeWindow - Add failing tests for new time window format"
```

---

## Task 3: Update service and route

**Files:**
- Modify: `back/src/libs/modules/homeTracker/services/getHistogramData.ts`
- Modify: `back/src/libs/routes/homeTracker/histogramData.ts`

- [ ] **Step 1: Replace `getHistogramData.ts` with updated implementation**

```typescript
import { elk } from '../../../databases/elk.js';
import { SensorLogData, TimeWindow } from '../types.js';
import { InvalidTimeWindowError } from '../errors.js';

interface SensorRecord {
    '@timestamp': number;
    document: SensorLogData;
}

interface HomeTrackerTimeData {
    tempCelsius?: {
        [sensorName: string]: number;
    };
    internalTempCelsius?: {
        [sensorName: string]: number;
    };
    batteryCharge?: {
        [sensorName: string]: number;
    };
    humidity?: {
        [sensorName: string]: number;
    };
    internalHumidity?: {
        [sensorName: string]: number;
    };
    pressurehPa?: {
        [sensorName: string]: number;
    };
}

interface HomeTrackerHistogramData {
    [timestamp: number]: HomeTrackerTimeData;
}

const computeNbBuckets = (startDateMs: number, endDateMs: number): number => {
    const durationMs = endDateMs - startDateMs;
    const MINUTE = 60_000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;

    let targetIntervalMs: number;
    if (durationMs <= 2 * HOUR) {
        targetIntervalMs = 2 * MINUTE;
    } else if (durationMs <= DAY) {
        targetIntervalMs = 15 * MINUTE;
    } else if (durationMs <= 14 * DAY) {
        targetIntervalMs = HOUR;
    } else if (durationMs <= 90 * DAY) {
        targetIntervalMs = 6 * HOUR;
    } else {
        targetIntervalMs = DAY;
    }

    return Math.ceil(durationMs / targetIntervalMs);
};

export const getHistogramData = async (timeWindow: TimeWindow) => {
    const { startDateMs, endDateMs } = timeWindow;

    if (startDateMs >= endDateMs) {
        throw new InvalidTimeWindowError();
    }

    const nbBuckets = computeNbBuckets(startDateMs, endDateMs);

    const result = await elk.search<SensorRecord>({
        index: 'data-home-tracker',
        size: 0,
        query: {
            range: {
                '@timestamp': {
                    gte: startDateMs,
                    lte: endDateMs
                }
            }
        },
        aggregations: {
            byDate: {
                auto_date_histogram: {
                    field: '@timestamp',
                    buckets: nbBuckets,
                    minimum_interval: 'minute'
                },
                aggregations: {
                    bySensor: {
                        terms: {
                            field: 'document.sensorName.keyword'
                        },
                        aggregations: {
                            tempCelsius: {
                                avg: { field: 'document.tempCelsius' }
                            },
                            internalTempCelsius: {
                                avg: { field: 'document.internalTempCelsius' }
                            },
                            humidity: {
                                avg: { field: 'document.humidity' }
                            },
                            internalHumidity: {
                                avg: { field: 'document.internalHumidity' }
                            },
                            pressurehPa: {
                                avg: { field: 'document.pressurehPa' }
                            },
                            batteryCharge: {
                                avg: { field: 'document.batteryCharge' }
                            }
                        }
                    }
                }
            }
        }
    });

    // @ts-expect-error Not sure why the `.buckets` member is not in the typing
    const timeBuckets = result.aggregations?.byDate.buckets || [];

    const sensorNames: Set<string> = new Set();
    const histogramData: HomeTrackerHistogramData = {};

    for (const timeBucket of timeBuckets) {
        const timeRecord: HomeTrackerTimeData = {};

        for (const sensorBucket of timeBucket.bySensor.buckets) {
            const sensorName = sensorBucket.key;

            sensorNames.add(sensorName);

            const tempCelsius = sensorBucket.tempCelsius.value;
            if (tempCelsius) {
                if (!timeRecord.tempCelsius) {
                    timeRecord.tempCelsius = {};
                }
                timeRecord.tempCelsius[sensorName] = tempCelsius;
            }
            const internalTempCelsius = sensorBucket.internalTempCelsius.value;
            if (internalTempCelsius) {
                if (!timeRecord.internalTempCelsius) {
                    timeRecord.internalTempCelsius = {};
                }
                timeRecord.internalTempCelsius[sensorName] = internalTempCelsius;
            }
            const batteryCharge = sensorBucket.batteryCharge.value;
            if (batteryCharge) {
                if (!timeRecord.batteryCharge) {
                    timeRecord.batteryCharge = {};
                }
                timeRecord.batteryCharge[sensorName] = batteryCharge;
            }
            const humidity = sensorBucket.humidity.value;
            if (humidity) {
                if (!timeRecord.humidity) {
                    timeRecord.humidity = {};
                }
                timeRecord.humidity[sensorName] = humidity;
            }
            const internalHumidity = sensorBucket.internalHumidity.value;
            if (internalHumidity) {
                if (!timeRecord.internalHumidity) {
                    timeRecord.internalHumidity = {};
                }
                timeRecord.internalHumidity[sensorName] = internalHumidity;
            }
            const pressurehPa = sensorBucket.pressurehPa.value;
            if (pressurehPa) {
                if (!timeRecord.pressurehPa) {
                    timeRecord.pressurehPa = {};
                }
                timeRecord.pressurehPa[sensorName] = pressurehPa;
            }
        }

        const ts = Math.floor(timeBucket.key / 1000);
        histogramData[ts] = timeRecord;
    }

    return { histogramData, sensorNames: [...sensorNames] };
};
```

- [ ] **Step 2: Replace `histogramData.ts` route with updated version**

```typescript
import { FromSchema } from 'json-schema-to-ts';
import { PostRoute, RouteHandler } from '../types.js';
import { getHistogramData } from '../../modules/homeTracker/index.js';

const handler: RouteHandler<Input> = (params) => {
    params.loggableContext.addData('timewindowStartMs', params.input.timeWindow.startDateMs);
    params.loggableContext.addData('timewindowEndMs', params.input.timeWindow.endDateMs);
    return getHistogramData(params.input.timeWindow);
};

const inputSchema = {
    type: 'object',
    required: ['timeWindow'],
    additionalProperties: false,
    properties: {
        timeWindow: {
            type: 'object',
            required: ['startDateMs', 'endDateMs'],
            additionalProperties: false,
            properties: {
                startDateMs: { type: 'number' },
                endDateMs: { type: 'number' }
            }
        }
    }
} as const;

const outputSchema = {
    type: 'object',
    properties: {
        sensorNames: {
            type: 'array',
            items: { type: 'string' }
        },
        histogramData: {
            type: 'object',
            additionalProperties: {
                type: 'object',
                properties: {
                    tempCelsius: { type: 'object', additionalProperties: { type: 'number' } },
                    internalTempCelsius: {
                        type: 'object',
                        additionalProperties: { type: 'number' }
                    },
                    batteryCharge: { type: 'object', additionalProperties: { type: 'number' } },
                    humidity: { type: 'object', additionalProperties: { type: 'number' } },
                    internalHumidity: {
                        type: 'object',
                        additionalProperties: { type: 'number' }
                    },
                    pressurehPa: { type: 'object', additionalProperties: { type: 'number' } }
                },
                additionalProperties: false
            }
        }
    },
    required: ['sensorNames', 'histogramData'],
    additionalProperties: false
} as const;

type Input = FromSchema<typeof inputSchema>;

export const route: PostRoute<Input, FromSchema<typeof outputSchema>> = {
    method: 'post',
    path: '/homeTracker/histogramData',
    inputSchema,
    scope: 'homeTracker',
    handler,
    authentication: 'user2',
    clientErrors: ['INVALID_TIME_WINDOW'],
    outputSchema
};
```

- [ ] **Step 3: Run all tests to confirm they pass**

```bash
cd back && npm run tests -- -f 'homeTracker/histogramData'
```

Expected: all 4 tests PASS.

- [ ] **Step 4: Run the full test suite to check for regressions**

```bash
cd back && npm run tests
```

Expected: all tests pass.

- [ ] **Step 5: Run lint and type checks**

```bash
cd back && npm run check
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add back/src/libs/modules/homeTracker/services/getHistogramData.ts \
        back/src/libs/routes/homeTracker/histogramData.ts
git commit -m "HomeTracker - TimeWindow - Update service and route to accept startDateMs/endDateMs"
```

---

## Task 4: Regenerate the frontend SDK

**Files:**
- Modify: `back/src/vendor/statox-api/index.ts` (auto-generated, do not edit manually)

The backend SDK is auto-generated from route definitions. The frontend uses it via `client2`.

- [ ] **Step 1: Generate the SDK**

```bash
cd back && npm run generate:sdk
```

Expected: the generated SDK file updates to reflect the new `timeWindow: { startDateMs, endDateMs }` input shape for `homeTracker.histogramData`.

- [ ] **Step 2: Commit the generated SDK**

```bash
git add front/src/vendor/statox-api/index.ts
git commit -m "HomeTracker - TimeWindow - Regenerate SDK with new timeWindow shape"
```

---

## Task 5: Update frontend types

**Files:**
- Modify: `front/src/lib/HomeTracker/types.ts`

- [ ] **Step 1: Remove old string TimeWindow types and add the new interface**

In `front/src/lib/HomeTracker/types.ts`, find and remove these two lines:

```typescript
export type TimeWindowPublic = '30m' | '3h' | '12h' | '1d' | '3d' | '7d' | '2w';

export type TimeWindow = TimeWindowPublic | '6M' | 'alltime';
```

Replace them with:

```typescript
export interface TimeWindow {
    startDateMs: number;
    endDateMs: number;
}
```

- [ ] **Step 2: Run frontend type check to see what needs fixing**

```bash
cd front && npm run check
```

Expected: errors in `store.ts`, `TimeWindowSelection.svelte`, `SensorsHistogram.svelte`, `SensorsSummary.svelte` — these are addressed in the following tasks.

- [ ] **Step 3: Commit the type change**

```bash
git add front/src/lib/HomeTracker/types.ts
git commit -m "HomeTracker - TimeWindow - Replace string TimeWindow type with object interface"
```

---

## Task 6: Update the frontend store

**Files:**
- Modify: `front/src/routes/(apps)/home-tracker/store.ts`

The store previously persisted a plain string to localStorage (e.g. `"1d"`). It now persists a JSON-serialised `TimeWindow` object. Old string values must be detected and replaced with the default.

- [ ] **Step 1: Replace the store file content**

```typescript
import type { TimeWindow } from '$lib/HomeTracker';
import { writable } from 'svelte/store';

const DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_TIME_WINDOW: TimeWindow = {
    startDateMs: Date.now() - DAY_MS,
    endDateMs: Date.now()
};

const parseStoredTimeWindow = (): TimeWindow => {
    const stored = localStorage.getItem('selectedTimeWindow');
    if (!stored) return DEFAULT_TIME_WINDOW;
    try {
        const parsed: unknown = JSON.parse(stored);
        if (typeof parsed === 'string') return DEFAULT_TIME_WINDOW;
        if (
            parsed !== null &&
            typeof parsed === 'object' &&
            'startDateMs' in parsed &&
            'endDateMs' in parsed &&
            typeof (parsed as TimeWindow).startDateMs === 'number' &&
            typeof (parsed as TimeWindow).endDateMs === 'number'
        ) {
            return parsed as TimeWindow;
        }
    } catch {
        // ignore malformed JSON
    }
    return DEFAULT_TIME_WINDOW;
};

export const selectedTimeWindow = writable<TimeWindow>(parseStoredTimeWindow());

selectedTimeWindow.subscribe((value) => {
    localStorage.setItem('selectedTimeWindow', JSON.stringify(value));
});
```

- [ ] **Step 2: Run type check**

```bash
cd front && npm run check 2>&1 | grep -E "store\.ts|error"
```

Expected: no errors in `store.ts` (errors in other files remain until later tasks).

- [ ] **Step 3: Commit**

```bash
git add front/src/routes/\(apps\)/home-tracker/store.ts
git commit -m "HomeTracker - TimeWindow - Update store to persist TimeWindow object with localStorage migration"
```

---

## Task 7: Update `TimeWindowSelection.svelte`

**Files:**
- Modify: `front/src/routes/(apps)/home-tracker/components/TimeWindowSelection.svelte`

The component keeps its dropdown UI. Instead of binding the store directly to the select, it holds an internal string state, converts to `TimeWindow` on change, and emits via `onSelect`.

- [ ] **Step 1: Replace the component content**

```svelte
<script lang="ts">
    import { user } from '$lib/auth';
    import type { TimeWindow } from '$lib/HomeTracker';
    import { selectedTimeWindow } from '../store';

    interface Props {
        onSelect: (newTimeWindow: TimeWindow) => void;
    }
    const { onSelect }: Props = $props();

    const ALLTIME_START_MS = new Date('2024-08-30T00:00:00Z').getTime();

    const authenticatedOptions = [
        { name: '30 minutes', value: '30m' },
        { name: '3 hours', value: '3h' },
        { name: '12 hours', value: '12h' },
        { name: '1 day', value: '1d' },
        { name: '3 days', value: '3d' },
        { name: '7 days', value: '7d' },
        { name: '2 weeks', value: '2w' },
        { name: '1 month', value: '1M' },
        { name: '2 month', value: '2M' },
        { name: '6 month', value: '6M' },
        { name: 'All time', value: 'alltime' }
    ];

    const unauthenticatedOptions = [
        { name: '30 minutes', value: '30m' },
        { name: '3 hours', value: '3h' },
        { name: '12 hours', value: '12h' },
        { name: '1 day', value: '1d' },
        { name: '3 days', value: '3d' },
        { name: '7 days', value: '7d' },
        { name: '2 weeks', value: '2w' }
    ];

    const options = $user ? authenticatedOptions : unauthenticatedOptions;

    const MINUTE = 60_000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;

    const offsetMap: Record<string, number> = {
        '30m': 30 * MINUTE,
        '3h': 3 * HOUR,
        '12h': 12 * HOUR,
        '1d': DAY,
        '3d': 3 * DAY,
        '7d': 7 * DAY,
        '2w': 14 * DAY,
        '1M': 30 * DAY,
        '2M': 60 * DAY,
        '6M': 182 * DAY
    };

    const toTimeWindow = (value: string): TimeWindow => {
        const now = Date.now();
        if (value === 'alltime') return { startDateMs: ALLTIME_START_MS, endDateMs: now };
        return { startDateMs: now - offsetMap[value], endDateMs: now };
    };

    let selectedValue = $state('1d');

    const handleChange = () => {
        const tw = toTimeWindow(selectedValue);
        selectedTimeWindow.set(tw);
        onSelect(tw);
    };
</script>

<div class="time-window-select">
    <label for="time-window-select" class="far fa-calendar-alt"></label>
    <select id="time-window-select" bind:value={selectedValue} onchange={handleChange}>
        {#each options as option}
            <option value={option.value}>{option.name}</option>
        {/each}
    </select>
</div>

<style>
    .time-window-select {
        display: flex;
        flex-wrap: wrap;
        justify-content: stretch;
        align-items: end;
        gap: 5px;
    }
</style>
```

- [ ] **Step 2: Run type check**

```bash
cd front && npm run check 2>&1 | grep -E "TimeWindowSelection|error"
```

Expected: no errors in `TimeWindowSelection.svelte`.

- [ ] **Step 3: Commit**

```bash
git add "front/src/routes/(apps)/home-tracker/components/TimeWindowSelection.svelte"
git commit -m "HomeTracker - TimeWindow - Convert dropdown selection to TimeWindow timestamps"
```

---

## Task 8: Update `SensorsHistogram.svelte` and `SensorsSummary.svelte`

**Files:**
- Modify: `front/src/routes/(apps)/home-tracker/components/SensorsHistogram.svelte`
- Modify: `front/src/routes/(apps)/home-tracker/components/SensorsSummary.svelte`

These only need their `TimeWindow` import updated — the type name stays the same but now resolves to the new interface.

- [ ] **Step 1: Update `SensorsHistogram.svelte`**

The import `import { getSensorsMetadata, getHistogramData, type TimeWindow } from '$lib/HomeTracker';` stays unchanged — `TimeWindow` now resolves to the new interface automatically. No other changes needed in this file.

Verify by inspecting the `refreshData` signature — `timeWindowInput: TimeWindow` and `getHistogramData({ timeWindow: $selectedTimeWindow })` both use the new object type. No code changes required.

- [ ] **Step 2: Update `SensorsSummary.svelte`**

Same situation — the `type TimeWindow` import resolves to the new interface. The `refreshData(timeWindowInput: TimeWindow)` parameter type is updated automatically. No code changes required.

- [ ] **Step 3: Run the full frontend type check**

```bash
cd front && npm run check
```

Expected: zero errors.

- [ ] **Step 4: Run lint**

```bash
cd front && npm run lint
```

Expected: no lint errors.

- [ ] **Step 5: Commit**

```bash
git add "front/src/routes/(apps)/home-tracker/components/SensorsHistogram.svelte" \
        "front/src/routes/(apps)/home-tracker/components/SensorsSummary.svelte"
git commit -m "HomeTracker - TimeWindow - Update SensorsHistogram and SensorsSummary to new TimeWindow type"
```

If there are no actual file changes (because types resolved without touching the files), skip this commit.

---

## Task 9: Final verification

- [ ] **Step 1: Run the full backend test suite**

```bash
cd back && npm run tests:all
```

Expected: all tests pass.

- [ ] **Step 2: Run backend lint and type check**

```bash
cd back && npm run check
```

Expected: no errors.

- [ ] **Step 3: Run frontend type check and lint**

```bash
cd front && npm run check && npm run lint
```

Expected: no errors.
