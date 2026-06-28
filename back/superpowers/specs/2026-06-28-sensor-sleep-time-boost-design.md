# Sensor Sleep-Time Boost - Design

Date: 2026-06-28

## Goal

Allow temporarily changing the sleep time ("boost mode") of a HomeTracker
sensor for a bounded duration. After the duration elapses, the sensor's sleep
time automatically reverts to its default. The revert happens lazily, piggy-
backing on the regularly-called `/homeTracker/upload` endpoint, so no periodic
task is needed.

## Background

- `/homeTracker/upload` is called regularly by each IoT sensor and returns
  `instructSleepSec`, telling the sensor how long to sleep before the next
  upload. The value comes from `getSensorSleepTimeSec`.
- Sleep times live in the `HomeTrackerSensor` MySQL table.

## Database changes (`src/tools/tables/HomeTrackerSensor.sql`)

Three columns related to sleep time:

```sql
`sleepTimeSec` int(5) default 596,            -- current (boostable) sleep time
`sleepTimeSecDefault` int(5) default 596,     -- baseline to reset back to
`nextSleepTimeResetUnix` int(11) unsigned NOT NULL default 0,
```

`sleepTimeSecDefault` and `nextSleepTimeResetUnix` are new.

Fix vs. the uncommitted draft: the draft line
`` `nextSleepTimeResetUnix` NOT NULL int(11) unsigned default now() `` is
invalid SQL - `NOT NULL` must follow the type, and `now()` produces a DATETIME
rather than a unix integer. We follow the existing `lastSyncDateUnix` pattern
and default to `0`.

Semantics of `nextSleepTimeResetUnix`:
- `0` (epoch) is always in the past, meaning "no active boost / expired".
- A fresh row has `sleepTimeSec == sleepTimeSecDefault`, so the reset query is a
  harmless no-op until a boost is actually set.

## Service layer (`src/libs/modules/homeTracker/services/sensorMetaData.ts`)

### `checkOrResetSensorSleepTime`

Single atomic UPDATE. No SELECT-then-branch (avoids races and extra queries):

```ts
const checkOrResetSensorSleepTime = async (params: { sensorName: string }) => {
    await db.execute(
        `UPDATE HomeTrackerSensor
         SET sleepTimeSec = sleepTimeSecDefault
         WHERE name = ?
           AND sleepTimeSec != sleepTimeSecDefault
           AND nextSleepTimeResetUnix < UNIX_TIMESTAMP()`,
        [params.sensorName]
    );
};
```

The `sleepTimeSec != sleepTimeSecDefault` guard makes this a no-op when no boost
is active, and the `nextSleepTimeResetUnix < UNIX_TIMESTAMP()` guard makes it a
no-op while a boost is still active.

### `getSensorSleepTimeSec`

Awaits `checkOrResetSensorSleepTime({ sensorName })` first, then runs the
existing SELECT unchanged. If a reset occurred, the SELECT returns the freshly
restored default value.

### `enableSensorBoost` (new, exported)

```ts
export const enableSensorBoost = async (params: {
    sensorName: string;
    sleepTimeSec: number;
    durationSec: number;
}) => {
    const [result] = await db.execute(
        `UPDATE HomeTrackerSensor
         SET sleepTimeSec = ?, nextSleepTimeResetUnix = UNIX_TIMESTAMP() + ?
         WHERE name = ?`,
        [params.sleepTimeSec, params.durationSec, params.sensorName]
    );
    if ((result as OkPacket).affectedRows === 0) {
        throw new SensorNotFoundError();
    }
};
```

Exported from `src/libs/modules/homeTracker/services/index.js`.

## Route (`src/libs/routes/homeTracker/enableSensorBoost.ts`)

Modeled on `updateSensorMetadata.ts`.

- method: `post`
- path: `/homeTracker/enableSensorBoost`
- authentication: `user2`, scope: `admin`
- `clientErrors: ['SENSOR_NOT_FOUND']`
- output: `emptyObjectSchema`
- handler: adds `sensorName` + `dataStr` to loggable context, calls
  `enableSensorBoost(params.input)`.

Input schema (minimal bounds, no upper caps):

```ts
{
    type: 'object',
    required: ['sensorName', 'sleepTimeSec', 'durationSec'],
    additionalProperties: false,
    properties: {
        sensorName: { type: 'string' },
        sleepTimeSec: { type: 'number', minimum: 1 },
        durationSec: { type: 'number', minimum: 1 }
    }
}
```

Registered in `src/libs/routes/index.ts` (import + add to `routes.list`).

## Tests

### `tests/routes/homeTracker/upload/upload.test.ts` (extend)

- Boost expired: fixture with `sleepTimeSec=300`, `sleepTimeSecDefault=596`,
  `nextSleepTimeResetUnix` in the past → upload returns
  `{ instructSleepSec: 596 }` and the table row `sleepTimeSec` is reset to 596.
- Boost active: fixture with `sleepTimeSec=120`, `sleepTimeSecDefault=596`,
  `nextSleepTimeResetUnix` in the future → upload returns
  `{ instructSleepSec: 120 }` and the row is unchanged.

### `tests/routes/homeTracker/enableSensorBoost/enableSensorBoost.test.ts` (new)

- Success: existing sensor → 200, empty body; row has new `sleepTimeSec` and
  `nextSleepTimeResetUnix ≈ now + durationSec` (use `aroundNowSec`-style matcher
  or a custom matcher checking the value is within tolerance of now+duration).
- Missing sensor → 400 with `{ httpStatus: 400, code: 'SENSOR_NOT_FOUND' }`.
- Schema rejection: `sleepTimeSec: 0` or `durationSec: 0` → 400 validation error.

## Out of scope

- No upper bounds on `sleepTimeSec` / `durationSec`.
- `tempOffset` float imprecision (pre-existing TODO) untouched.
- Sensor identification by name (rather than a dedicated id) is kept as-is.

## Follow-up actions (user-run, per repo rules)

- `npm run generate:sdk` after the route is added.
- Any `git commit` is left to the user.
