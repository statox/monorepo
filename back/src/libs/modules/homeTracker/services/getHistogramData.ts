import { elk } from '../../../databases/elk.js';
import { SensorLogData, TimeWindow } from '../types.js';
import { InvalidTimeWindowError } from '../errors.js';
import { getMonitoredSensors } from './monitorSensors.js';

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
        targetIntervalMs = 10 * MINUTE;
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

    const monitoredSensors = await getMonitoredSensors();
    const monitoredSensorNames = monitoredSensors.map((s) => s.name);

    const result = await elk.search<SensorRecord>({
        index: 'data-home-tracker',
        size: 0,
        query: {
            bool: {
                filter: [
                    {
                        range: {
                            '@timestamp': {
                                gte: startDateMs,
                                lte: endDateMs
                            }
                        }
                    },
                    {
                        terms: {
                            'document.sensorName.keyword': monitoredSensorNames
                        }
                    }
                ]
            }
        },
        aggregations: {
            byDate: {
                auto_date_histogram: {
                    field: '@timestamp',
                    buckets: nbBuckets
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
