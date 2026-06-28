# Sensor Sleep-Time Boost Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin temporarily change a HomeTracker sensor's sleep time for a bounded duration, after which it auto-reverts to the default on the next `/homeTracker/upload` call.

**Architecture:** Add `sleepTimeSecDefault` + `nextSleepTimeResetUnix` columns to `HomeTrackerSensor`. A new `enableSensorBoost` service/route sets the boosted sleep time and an expiry timestamp. `getSensorSleepTimeSec` (called by `/homeTracker/upload`) first runs an atomic `checkOrResetSensorSleepTime` UPDATE that restores the default once the expiry has passed - no periodic task needed.

**Tech Stack:** TypeScript, Express, MySQL (mysql2), Mocha + Chai + Supertest, JSON-schema route validation.

---

## Spec

Design doc: `back/superpowers/specs/2026-06-28-sensor-sleep-time-boost-design.md`

## File Structure

- Modify: `src/tools/tables/HomeTrackerSensor.sql` - fix + add the two columns.
- Modify: `src/libs/modules/homeTracker/services/sensorMetaData.ts` - implement `checkOrResetSensorSleepTime`, wire it into `getSensorSleepTimeSec`, add `enableSensorBoost`.
- Modify: `src/libs/modules/homeTracker/services/index.js` - export `enableSensorBoost`.
- Create: `src/libs/routes/homeTracker/enableSensorBoost.ts` - the new route (replaces the spec-comment placeholder file).
- Modify: `src/libs/routes/index.ts` - register the route.
- Modify: `tests/routes/homeTracker/upload/upload.test.ts` - reset-on-upload cases.
- Create: `tests/routes/homeTracker/enableSensorBoost/enableSensorBoost.test.ts` - new route tests.

---

## Task 1: Database schema

**Files:**
- Modify: `src/tools/tables/HomeTrackerSensor.sql:9-11`

- [ ] **Step 1: Fix the column definitions**

Replace the current three sleep-time related lines (the `sleepTimeSec` line plus the two uncommitted draft lines) so the block reads exactly:

```sql
    `sleepTimeSec` int(5) default 596, -- Current sleepTime in seconds (can be modified by boost mode)
    `sleepTimeSecDefault` int(5) default 596, -- The default is 9 minutes 56 seconds to try to reduce drift due to sensors restarting
    `nextSleepTimeResetUnix` int(11) unsigned NOT NULL default 0, -- Boost expiry: when sleepTimeSec is reset to sleepTimeSecDefault (0 = no active boost)
```

The fix vs. the draft: `NOT NULL` now follows the type, and the default is `0` (a valid unix int) instead of `now()` (a DATETIME, invalid for an int column).

- [ ] **Step 2: Recreate the test DB tables so the new columns exist**

The test suite runs against the test database. `CREATE TABLE IF NOT EXISTS` will NOT add columns to an already-existing table, so the table must be recreated.

Run: `./src/tools/init-db.sh --tests`
Expected: completes without error; `HomeTrackerSensor` now has `sleepTimeSecDefault` and `nextSleepTimeResetUnix` columns.

If the script does not drop/recreate existing tables, drop the `HomeTrackerSensor` table in the test DB first, then re-run. Verify with a quick describe if unsure.

- [ ] **Step 3: Commit**

```bash
git add src/tools/tables/HomeTrackerSensor.sql
git commit -m "HomeTracker - Add boost columns to HomeTrackerSensor table"
```

---

## Task 2: `enableSensorBoost` service function

**Files:**
- Modify: `src/libs/modules/homeTracker/services/sensorMetaData.ts`
- Modify: `src/libs/modules/homeTracker/services/index.ts`

This task adds the service function. It is verified end-to-end via the route test in Task 3 (the service is not exported in a way that has a direct unit test harness in this codebase; route integration tests are the established pattern). Implementation is small and mirrors the existing `updateSensorMetadata`.

- [ ] **Step 1: Add the `enableSensorBoost` function**

In `src/libs/modules/homeTracker/services/sensorMetaData.ts`, after `updateSensorMetadata`, add:

```ts
export const enableSensorBoost = async (params: {
    sensorName: string;
    sleepTimeSec: number;
    durationSec: number;
}) => {
    const [result] = await db.execute(
        `
        UPDATE HomeTrackerSensor SET
            sleepTimeSec = ?,
            nextSleepTimeResetUnix = UNIX_TIMESTAMP() + ?
        WHERE name = ?`,
        [params.sleepTimeSec, params.durationSec, params.sensorName]
    );

    if ((result as OkPacket).affectedRows === 0) {
        throw new SensorNotFoundError();
    }
};
```

`OkPacket` and `SensorNotFoundError` are already imported in this file.

- [ ] **Step 2: Export it**

In `src/libs/modules/homeTracker/services/index.ts`, add `enableSensorBoost` to the export from `./sensorMetaData.js`:

```ts
export {
    enableSensorBoost,
    getSensorSleepTimeSec,
    updateSensorLastSyncDate,
    updateSensorMetadata
} from './sensorMetaData.js';
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run lint`
Expected: no errors for the modified files.

- [ ] **Step 4: Commit**

```bash
git add src/libs/modules/homeTracker/services/sensorMetaData.ts src/libs/modules/homeTracker/services/index.ts
git commit -m "HomeTracker - Add enableSensorBoost service function"
```

---

## Task 3: `enableSensorBoost` route + tests

**Files:**
- Create: `src/libs/routes/homeTracker/enableSensorBoost.ts` (overwrite the existing placeholder file)
- Modify: `src/libs/routes/index.ts`
- Test: `tests/routes/homeTracker/enableSensorBoost/enableSensorBoost.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/routes/homeTracker/enableSensorBoost/enableSensorBoost.test.ts`:

```ts
import request from 'supertest';
import { assert } from 'chai';
import { app } from '../../../../src/app.js';
import { th } from '../../../helpers/index.js';

describe('homeTracker/enableSensorBoost', () => {
    it('Should set the boosted sleep time and the reset expiry', async () => {
        await th.mysql.fixture({
            HomeTrackerSensor: [
                {
                    id: 1,
                    name: 'foo',
                    hexColor: '#FF0000',
                    sleepTimeSec: 596,
                    sleepTimeSecDefault: 596,
                    nextSleepTimeResetUnix: 0
                }
            ]
        });

        const body = {
            sensorName: 'foo',
            sleepTimeSec: 120,
            durationSec: 3600
        };

        await request(app)
            .post('/homeTracker/enableSensorBoost')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send(body)
            .expect(200);

        const expectedReset = th.mysql.nowSec() + 3600;

        await th.mysql.checkContains({
            HomeTrackerSensor: [
                {
                    id: 1,
                    name: 'foo',
                    sleepTimeSec: 120,
                    nextSleepTimeResetUnix: (value: number) =>
                        Math.abs(value - expectedReset) <= 2
                }
            ]
        });
    });

    it('Should fail for a non-existing sensor', async () => {
        await th.mysql.fixture({ HomeTrackerSensor: [] });

        const res = await request(app)
            .post('/homeTracker/enableSensorBoost')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({ sensorName: 'foo', sleepTimeSec: 120, durationSec: 3600 })
            .expect(400);

        assert.deepEqual(res.body, { httpStatus: 400, code: 'SENSOR_NOT_FOUND' });
    });

    it('Should reject a non-positive sleepTimeSec', async () => {
        await th.mysql.fixture({ HomeTrackerSensor: [] });

        await request(app)
            .post('/homeTracker/enableSensorBoost')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({ sensorName: 'foo', sleepTimeSec: 0, durationSec: 3600 })
            .expect(400);
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run tests -- -f 'homeTracker/enableSensorBoost'`
Expected: FAIL - route returns 404 / not registered (the placeholder file exports no `route`).

- [ ] **Step 3: Write the route**

Overwrite `src/libs/routes/homeTracker/enableSensorBoost.ts` (currently a spec comment) with:

```ts
import { FromSchema } from 'json-schema-to-ts';
import { EmptyOutput, PostRoute, RouteHandler } from '../types.js';
import { enableSensorBoost } from '../../modules/homeTracker/index.js';
import { emptyObjectSchema } from '../helpers.js';

const handler: RouteHandler<Input> = async (params) => {
    params.loggableContext.addData('sensorName', params.input.sensorName);
    params.loggableContext.addData('dataStr', JSON.stringify(params.input));

    await enableSensorBoost(params.input);
    return;
};

const inputSchema = {
    type: 'object',
    required: ['sensorName', 'sleepTimeSec', 'durationSec'],
    additionalProperties: false,
    properties: {
        sensorName: { type: 'string' },
        sleepTimeSec: { type: 'number', minimum: 1 },
        durationSec: { type: 'number', minimum: 1 }
    }
} as const;
type Input = FromSchema<typeof inputSchema>;

export const route: PostRoute<Input, EmptyOutput> = {
    method: 'post',
    path: '/homeTracker/enableSensorBoost',
    inputSchema: inputSchema,
    handler,
    authentication: 'user2',
    scope: 'admin',
    clientErrors: ['SENSOR_NOT_FOUND'],
    outputSchema: emptyObjectSchema
};
```

- [ ] **Step 4: Register the route**

In `src/libs/routes/index.ts`, add the import next to the other HomeTracker imports (alphabetical-ish, near line 23):

```ts
import { route as HomeTracker_enableSensorBoost } from './homeTracker/enableSensorBoost.js';
```

Then add `HomeTracker_enableSensorBoost` to the `routes.list` array (place it alongside the other `HomeTracker_*` entries).

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run tests -- -f 'homeTracker/enableSensorBoost'`
Expected: PASS (all three cases).

- [ ] **Step 6: Commit**

```bash
git add src/libs/routes/homeTracker/enableSensorBoost.ts src/libs/routes/index.ts tests/routes/homeTracker/enableSensorBoost/enableSensorBoost.test.ts
git commit -m "HomeTracker - Add enableSensorBoost route"
```

---

## Task 4: `checkOrResetSensorSleepTime` + auto-reset on upload

**Files:**
- Modify: `src/libs/modules/homeTracker/services/sensorMetaData.ts:52-97`
- Test: `tests/routes/homeTracker/upload/upload.test.ts`

- [ ] **Step 1: Write the failing tests**

Append these two `it` blocks inside the existing `describe('homeTracker/upload', ...)` in `tests/routes/homeTracker/upload/upload.test.ts`:

```ts
    it('should reset the sleep time to the default when the boost has expired', async () => {
        await th.mysql.fixture({
            HomeTrackerSensor: [
                {
                    id: 1,
                    name: 'foo',
                    hexColor: '#FF0000',
                    sleepTimeSec: 120,
                    sleepTimeSecDefault: 596,
                    nextSleepTimeResetUnix: th.mysql.nowSec() - 60
                }
            ]
        });

        const res = await request(app)
            .post('/homeTracker/upload')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer fakeaccesskeyfortests')
            .send({ sensorName: 'foo', tempCelsius: 23.5 })
            .expect(200);

        assert.deepEqual(res.body, { instructSleepSec: 596 });

        await th.mysql.checkContains({
            HomeTrackerSensor: [{ id: 1, name: 'foo', sleepTimeSec: 596 }]
        });
    });

    it('should keep the boosted sleep time while the boost is still active', async () => {
        await th.mysql.fixture({
            HomeTrackerSensor: [
                {
                    id: 1,
                    name: 'foo',
                    hexColor: '#FF0000',
                    sleepTimeSec: 120,
                    sleepTimeSecDefault: 596,
                    nextSleepTimeResetUnix: th.mysql.nowSec() + 3600
                }
            ]
        });

        const res = await request(app)
            .post('/homeTracker/upload')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer fakeaccesskeyfortests')
            .send({ sensorName: 'foo', tempCelsius: 23.5 })
            .expect(200);

        assert.deepEqual(res.body, { instructSleepSec: 120 });

        await th.mysql.checkContains({
            HomeTrackerSensor: [{ id: 1, name: 'foo', sleepTimeSec: 120 }]
        });
    });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run tests -- -f 'homeTracker/upload'`
Expected: the "reset ... when the boost has expired" case FAILS - it returns `{ instructSleepSec: 120 }` because no reset happens yet. (The "still active" case may already pass.)

- [ ] **Step 3: Implement `checkOrResetSensorSleepTime` and wire it in**

In `src/libs/modules/homeTracker/services/sensorMetaData.ts`, replace the placeholder block (the `checkOrResetSensorSleepTime` stub comment + stub, and the TODO comment inside `getSensorSleepTimeSec`) so it reads:

```ts
// Reset a sensor's sleepTimeSec back to its default once a boost has expired.
// Single atomic UPDATE: the guards make it a no-op when no boost is active
// (sleepTimeSec already equals the default) or while a boost is still running
// (nextSleepTimeResetUnix is in the future).
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

export const getSensorSleepTimeSec = async (params: { sensorName: string }): Promise<number> => {
    await checkOrResetSensorSleepTime({ sensorName: params.sensorName });

    const [rows] = await db.query<({ sleepTimeSec: number } & RowDataPacket)[]>(
        `SELECT sleepTimeSec FROM HomeTrackerSensor WHERE name = ?`,
        [params.sensorName]
    );
```

(Leave the rest of `getSensorSleepTimeSec` - the `rows.length` checks and `return rows[0].sleepTimeSec` - unchanged.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run tests -- -f 'homeTracker/upload'`
Expected: PASS (all upload cases, including the two new ones).

- [ ] **Step 5: Commit**

```bash
git add src/libs/modules/homeTracker/services/sensorMetaData.ts tests/routes/homeTracker/upload/upload.test.ts
git commit -m "HomeTracker - Auto-reset sensor sleep time when boost expires"
```

---

## Task 5: Final verification

- [ ] **Step 1: Run the full homeTracker route suite**

Run: `npm run tests -- -f 'homeTracker'`
Expected: PASS.

- [ ] **Step 2: Run lint + formatting**

Run: `npm run check`
Expected: no errors. If prettier flags formatting, run `npm run prettier:fix` and re-run `npm run check`.

- [ ] **Step 3: Regenerate the SDK (user-run)**

Per the monorepo rule, adding a route requires SDK regeneration. This is left for the user to run:

```bash
npm run generate:sdk
```

Flag to the user that this is pending and let them run it.

---

## Self-Review notes

- **Spec coverage:** DB columns (Task 1), `checkOrResetSensorSleepTime` + `getSensorSleepTimeSec` wiring (Task 4), `enableSensorBoost` service (Task 2) + route (Task 3), upload tests (Task 4), boost route tests (Task 3), SDK regen flagged (Task 5). All spec sections covered.
- **Type consistency:** `enableSensorBoost({ sensorName, sleepTimeSec, durationSec })` and `checkOrResetSensorSleepTime({ sensorName })` signatures match across service and route. Route path `/homeTracker/enableSensorBoost` consistent across route file, registration, and tests.
- **No placeholders:** every code/command step contains concrete content.
