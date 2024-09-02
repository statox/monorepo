export interface HomeTrackerLatestResponse {
    recordsBySensor: RecordsBySensor;
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
