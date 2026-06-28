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
