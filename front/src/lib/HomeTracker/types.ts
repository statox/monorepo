export interface SensorMetadata {
    sensorName: string;
    iconPath: string;
    hexColor: string;
    tempOffset: number;
    sleepTimeSec: number;
    lastSyncDateUnix: number;
    lastAlertDateUnix: number | null;
    lastLogData: SensorLogData;
    oneHourAgoLogData: SensorLogData;
    oneDayAgoLogData: SensorLogData;
}

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

export interface SensorLogData {
    timestamp: number;
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

export interface TimeWindow {
    startDateMs: number;
    endDateMs: number;
}

export type Trend = 'falling' | 'rising' | 'steady' | 'unknown';
export interface WeatherForecast {
    pressureTrend: Trend;
    forecast: string;
    dataPoints?: {
        oldest: {
            timestampMs: number;
            pressurehPa: number;
        };
        latest: {
            timestampMs: number;
            pressurehPa: number;
        };
    };
}

export interface PressureHistoryItem {
    timestamp: number;
    averagePressurehPa: number;
}

