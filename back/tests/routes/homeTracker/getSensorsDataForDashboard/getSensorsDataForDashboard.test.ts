import request from 'supertest';
import { app } from '../../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../../helpers/index.js';
import { DateTime } from 'luxon';

describe('homeTracker/getSensorsDataForDashboard', () => {
    it('Should not return non monitored sensors', async () => {
        const nowMillis = DateTime.now().toMillis();
        const nowSec = Math.floor(nowMillis / 1000);
        const tenMinutesAgoMillis = DateTime.now().minus({ minutes: 10 }).toMillis();
        const tenMinutesAgoSec = Math.floor(tenMinutesAgoMillis / 1000);
        const oneDayAgoMillis = DateTime.now().minus({ day: 1 }).toMillis();

        await th.mysql.fixture({
            HomeTrackerSensor: [
                {
                    name: 'salon',
                    hexColor: '#FF0000',
                    lastSyncDateUnix: nowSec,
                    lastAlertDateUnix: tenMinutesAgoSec,
                    tempOffset: -1.2,
                    sleepTimeSec: 300,
                    isMonitored: true
                },
                {
                    name: 'jardiniere',
                    hexColor: '#00FF00',
                    lastSyncDateUnix: tenMinutesAgoSec,
                    tempOffset: 0.2,
                    isMonitored: false
                }
            ]
        });

        await th.elk.flush();
        await th.elk.fixture({
            'data-home-tracker': [
                {
                    '@timestamp': nowMillis,
                    document: {
                        sensorName: 'salon',
                        batteryCharge: 4,
                        humidity: 30,
                        tempCelsius: 21
                    }
                },
                {
                    '@timestamp': tenMinutesAgoMillis,
                    document: {
                        sensorName: 'salon',
                        batteryCharge: 4,
                        humidity: 0,
                        tempCelsius: 0
                    }
                },
                {
                    '@timestamp': oneDayAgoMillis,
                    document: {
                        sensorName: 'salon',
                        batteryCharge: 5,
                        humidity: 10,
                        tempCelsius: 10
                    }
                },
                {
                    '@timestamp': tenMinutesAgoMillis,
                    document: {
                        sensorName: 'jardiniere',
                        batteryCharge: 4,
                        humidity: 30,
                        tempCelsius: 21
                    }
                }
            ]
        });

        const response = await request(app)
            .get('/homeTracker/getSensorsDataForDashboard')
            .expect(200);

        const { sensors } = response.body;

        assert.sameDeepMembers(sensors, [
            {
                sensorName: 'salon',
                hexColor: '#FF0000',
                tempOffset: -1.2,
                sleepTimeSec: 300,
                sleepTimeSecDefault: 596,
                nextSleepTimeResetUnix: 0,
                lastSyncDateUnix: nowSec,
                lastAlertDateUnix: tenMinutesAgoSec,
                lastLogData: {
                    timestamp: nowMillis,
                    sensorName: 'salon',
                    batteryCharge: 4,
                    humidity: 30,
                    tempCelsius: 21
                },
                oneHourAgoLogData: {
                    // We just _try_ to get the log the closest to one hour ago
                    // Given the fixtures here it's the one from 10 minutes ago
                    timestamp: tenMinutesAgoMillis,
                    sensorName: 'salon',
                    batteryCharge: 4,
                    humidity: 0,
                    tempCelsius: 0
                },
                oneDayAgoLogData: {
                    // We just _try_ to get the log the closest to one day ago
                    // Given the fixtures here we do get the log from 1 day ago
                    timestamp: oneDayAgoMillis,
                    sensorName: 'salon',
                    batteryCharge: 5,
                    humidity: 10,
                    tempCelsius: 10
                }
            }
        ]);
    });

    it('Should work with hyphenated sensor names', async () => {
        const nowMillis = DateTime.now().toMillis();
        const nowSec = Math.floor(nowMillis / 1000);
        const oneHourAgoMillis = DateTime.now().minus({ hours: 1 }).toMillis();
        const oneDayAgoMillis = DateTime.now().minus({ day: 1 }).toMillis();

        await th.mysql.fixture({
            HomeTrackerSensor: [
                {
                    name: 'dev-salon',
                    hexColor: '#FF0000',
                    lastSyncDateUnix: nowSec,
                    isMonitored: true
                }
            ]
        });

        await th.elk.flush();
        await th.elk.fixture({
            'data-home-tracker': [
                {
                    '@timestamp': nowMillis,
                    document: { sensorName: 'dev-salon', tempCelsius: 21, humidity: 30 }
                },
                {
                    '@timestamp': oneHourAgoMillis,
                    document: { sensorName: 'dev-salon', tempCelsius: 20, humidity: 32 }
                },
                {
                    '@timestamp': oneDayAgoMillis,
                    document: { sensorName: 'dev-salon', tempCelsius: 19, humidity: 35 }
                }
            ]
        });

        const response = await request(app)
            .get('/homeTracker/getSensorsDataForDashboard')
            .expect(200);

        const { sensors } = response.body;
        assert.lengthOf(sensors, 1);
        assert.equal(sensors[0].sensorName, 'dev-salon');
        assert.equal(sensors[0].lastLogData.tempCelsius, 21);
        assert.equal(sensors[0].oneHourAgoLogData.tempCelsius, 20);
        assert.equal(sensors[0].oneDayAgoLogData.tempCelsius, 19);
    });

    it('Should return one entry by sensor with the last log', async () => {
        const nowMillis = DateTime.now().toMillis();
        const nowSec = Math.floor(nowMillis / 1000);
        const tenMinutesAgoMillis = DateTime.now().minus({ minutes: 10 }).toMillis();
        const tenMinutesAgoSec = Math.floor(tenMinutesAgoMillis / 1000);
        const twentyMinutesAgoMillis = DateTime.now().minus({ minutes: 20 }).toMillis();
        const oneDayAgoMillis = DateTime.now().minus({ day: 1 }).toMillis();

        await th.mysql.fixture({
            HomeTrackerSensor: [
                {
                    name: 'salon',
                    hexColor: '#FF0000',
                    lastSyncDateUnix: nowSec,
                    lastAlertDateUnix: tenMinutesAgoSec,
                    tempOffset: -1.2,
                    sleepTimeSec: 300,
                    isMonitored: true
                },
                {
                    name: 'jardiniere',
                    hexColor: '#00FF00',
                    lastSyncDateUnix: tenMinutesAgoSec,
                    tempOffset: 0.2,
                    isMonitored: true
                }
            ]
        });

        await th.elk.flush();
        await th.elk.fixture({
            'data-home-tracker': [
                {
                    // Make sure we don't return sensors which are not in the HomeTrackerSensor table
                    '@timestamp': tenMinutesAgoMillis,
                    document: {
                        sensorName: 'not-in-db',
                        batteryCharge: 0,
                        humidity: 0,
                        tempCelsius: 0
                    }
                },
                {
                    '@timestamp': nowMillis,
                    document: {
                        sensorName: 'salon',
                        batteryCharge: 4,
                        humidity: 30,
                        tempCelsius: 21
                    }
                },
                {
                    '@timestamp': tenMinutesAgoMillis,
                    document: {
                        sensorName: 'salon',
                        batteryCharge: 4,
                        humidity: 0,
                        tempCelsius: 0
                    }
                },
                {
                    '@timestamp': oneDayAgoMillis,
                    document: {
                        sensorName: 'salon',
                        batteryCharge: 5,
                        humidity: 10,
                        tempCelsius: 10
                    }
                },
                {
                    '@timestamp': tenMinutesAgoMillis,
                    document: {
                        sensorName: 'jardiniere',
                        batteryCharge: 4,
                        humidity: 30,
                        tempCelsius: 21
                    }
                },
                {
                    '@timestamp': twentyMinutesAgoMillis,
                    document: {
                        sensorName: 'jardiniere',
                        batteryCharge: 4,
                        humidity: 0,
                        tempCelsius: 0
                    }
                }
            ]
        });

        const response = await request(app)
            .get('/homeTracker/getSensorsDataForDashboard')
            .expect(200);

        const { sensors } = response.body;

        assert.sameDeepMembers(sensors, [
            {
                sensorName: 'jardiniere',
                hexColor: '#00FF00',
                tempOffset: 0.2,
                sleepTimeSec: 596,
                sleepTimeSecDefault: 596,
                nextSleepTimeResetUnix: 0,
                lastSyncDateUnix: tenMinutesAgoSec,
                lastAlertDateUnix: null,
                lastLogData: {
                    timestamp: tenMinutesAgoMillis,
                    sensorName: 'jardiniere',
                    batteryCharge: 4,
                    humidity: 30,
                    tempCelsius: 21
                },
                oneHourAgoLogData: {
                    // We just _try_ to get the log the closest to one hour ago
                    // Given the fixtures here it's the one from 20 minutes ago
                    timestamp: twentyMinutesAgoMillis,
                    sensorName: 'jardiniere',
                    batteryCharge: 4,
                    humidity: 0,
                    tempCelsius: 0
                },
                oneDayAgoLogData: {
                    // We just _try_ to get the log the closest to one day ago
                    // Given the fixtures here it's the one from 20 minutes ago
                    timestamp: twentyMinutesAgoMillis,
                    sensorName: 'jardiniere',
                    batteryCharge: 4,
                    humidity: 0,
                    tempCelsius: 0
                }
            },
            {
                sensorName: 'salon',
                hexColor: '#FF0000',
                tempOffset: -1.2,
                sleepTimeSec: 300,
                sleepTimeSecDefault: 596,
                nextSleepTimeResetUnix: 0,
                lastSyncDateUnix: nowSec,
                lastAlertDateUnix: tenMinutesAgoSec,
                lastLogData: {
                    timestamp: nowMillis,
                    sensorName: 'salon',
                    batteryCharge: 4,
                    humidity: 30,
                    tempCelsius: 21
                },
                oneHourAgoLogData: {
                    // We just _try_ to get the log the closest to one hour ago
                    // Given the fixtures here it's the one from 10 minutes ago
                    timestamp: tenMinutesAgoMillis,
                    sensorName: 'salon',
                    batteryCharge: 4,
                    humidity: 0,
                    tempCelsius: 0
                },
                oneDayAgoLogData: {
                    // We just _try_ to get the log the closest to one day ago
                    // Given the fixtures here we do get the log from 1 day ago
                    timestamp: oneDayAgoMillis,
                    sensorName: 'salon',
                    batteryCharge: 5,
                    humidity: 10,
                    tempCelsius: 10
                }
            }
        ]);
    });
});
