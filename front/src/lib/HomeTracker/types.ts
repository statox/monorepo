import type { LunarPhase } from 'lunarphase-js';

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

export type TimeWindowPublic = '30m' | '3h' | '12h' | '1d' | '3d' | '7d' | '2w';

export type TimeWindow = TimeWindowPublic | '6M' | 'alltime';

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

export enum LunarPhaseFrench {
    NEW = 'Nouvelle lune',
    WAXING_CRESCENT = 'Premier croissant',
    FIRST_QUARTER = 'Premier quartier',
    WAXING_GIBBOUS = 'Gibeuse croissante',
    FULL = 'Pleine lune',
    WANING_GIBBOUS = 'Gibeuse décroissante',
    LAST_QUARTER = 'Dernier quartier',
    WANING_CRESCENT = 'Dernier croissant'
}

interface MoonState {
    lunarAge: number;
    lunarAgePercent: number;
    moonPhase: LunarPhase;
    moonPhaseFr: LunarPhaseFrench;
    moonVisibilityWindow: string[];
}

export type EnrichedMoonState = MoonState & {
    phasePictureUrl: string;
};

export interface Ephemerides {
    sunState: {
        sunrise: number;
        sunset: number;
        solarNoon: number;
        goldenHour: number;
        dayLengthMs: number;
        dayLengthDiffMs: number;
    };
    moonState: MoonState;
    upcomingLunarStates: {
        tsMillis: number;
        lunarState: MoonState;
    }[];
}
