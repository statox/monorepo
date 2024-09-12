export interface HomeTrackerLatestResponse {
    histogramData: HomeTrackerHistogramData;
    sensorNames: string[];
}

export interface HomeTrackerTimeData {
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

export interface HomeTrackerHistogramData {
    [timestamp: number]: HomeTrackerTimeData;
}

export interface RecordsBySensor {
    [sensorName: string]: SensorRecord[];
}

export interface SensorRecord {
    '@timestamp': number;
    document: SensorLogData;
}

export interface SensorLogData {
    sensorName: string;

    batteryCharge?: number;
    batteryPercent?: number;
    detectedForcedReset?: boolean;
    detectedInternalSensorFailure?: boolean;
    detectedLowBattery?: boolean;
    detectedSensorFailure?: boolean;
    humidity?: number;
    internalHumidity?: number;
    internalTempCelsius?: number;
    pressurehPa?: number;
    tempCelsius?: number;
    timeToSendMs?: number;
}
