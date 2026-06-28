import { OkPacket, RowDataPacket } from 'mysql2';
import { db } from '../../../databases/db.js';
import { slog } from '../../logging/index.js';
import { SensorNotFoundError } from '../errors.js';

type SensorMetaData = {
    sqlId: number;
    name: string;
    lastSyncDateUnix: number;
    lastAlertDateUnix: number | null;
    hexColor: string;
    tempOffset: number;
    sleepTimeSec: number;
    sleepTimeSecDefault: number;
    nextSleepTimeResetUnix: number;
    isMonitored: boolean;
};

type SensorMetaDataResults = SensorMetaData & RowDataPacket;

export const getAllSensorsMetadata = async (): Promise<SensorMetaData[]> => {
    const [rows] = await db.query<SensorMetaDataResults[]>(
        `SELECT
            id as sqlId,
            name,
            lastSyncDateUnix,
            lastAlertDateUnix,
            hexColor,
            tempOffset,
            sleepTimeSec,
            sleepTimeSecDefault,
            nextSleepTimeResetUnix,
            isMonitored
        FROM HomeTrackerSensor
    `
    );

    return rows;
};

export const updateSensorLastSyncDate = (params: { sensorName: string }) => {
    db.query(
        `UPDATE HomeTrackerSensor
        SET lastSyncDateUnix = UNIX_TIMESTAMP()
        WHERE name = ?
        `,
        [params.sensorName]
    );
};

// If a sensor is not in the table we shouldn't fail the ingestion so
// we set a default sleep time at 10 minutes -4 seconds.
// The -4 seconds is to try to reduce the drift due to sensors restarting
const SENSORS_DEFAULT_SLEEP_TIME_SEC = 10 * 60 - 4;

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

    if (rows.length === 0) {
        slog.log('home-tracker', 'Using default sleep time. Sensor name not found', {
            sensorName: params.sensorName
        });
        return SENSORS_DEFAULT_SLEEP_TIME_SEC;
    }
    if (rows.length > 1) {
        slog.log(
            'home-tracker',
            'Using default sleep time. Several lines found with the same sensor name',
            { sensorName: params.sensorName }
        );
        return SENSORS_DEFAULT_SLEEP_TIME_SEC;
    }

    return rows[0].sleepTimeSec;
};

export const updateSensorMetadata = async (params: {
    sensorName: string;
    hexColor: string;
    tempOffset: number;
    sleepTimeSec: number;
}) => {
    const [result] = await db.execute(
        `
        UPDATE HomeTrackerSensor SET
            hexColor = ?,
            tempOffset = ?,
            sleepTimeSec = ?
        WHERE name = ?`,
        [params.hexColor, params.tempOffset, params.sleepTimeSec, params.sensorName]
    );

    if ((result as OkPacket).affectedRows === 0) {
        throw new SensorNotFoundError();
    }
};

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
