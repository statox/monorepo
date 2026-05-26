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
                const allTemps = Object.values(
                    histogramData as Record<string, { tempCelsius?: Record<string, number> }>
                ).flatMap((bucket) => Object.values(bucket.tempCelsius ?? {}));
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
