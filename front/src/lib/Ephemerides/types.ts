import type { LunarPhase } from 'lunarphase-js';

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

export type SolarEvent =
    | "Solstice d'été"
    | "Solstice d'hiver"
    | 'Équinoxe de printemps'
    | "Équinoxe d'automne";

export interface MoonVisibilitySegment {
    startPercent: number;
    widthPercent: number;
}

export interface YearlyEphemerisDay {
    dateMs: number;
    dateFormatted: string;
    sunrisePercent: number;
    sunsetPercent: number;
    sunriseFormatted: string;
    sunsetFormatted: string;
    dayLengthFormatted: string;
    dayLengthDiffNormalized: number;
    dayLengthDiffMs: number;
    dayLengthDiffFormatted: string;
    showMoonIcon: boolean;
    moonIconURL: string;
    moonPhaseFr: string;
    moonVisibilitySegments: MoonVisibilitySegment[];
    moonriseFormatted: string;
    moonsetFormatted: string;
    isFirstOfMonth: boolean;
    monthLabel: string;
    isToday: boolean;
    solarEvent: SolarEvent | null;
    lunarDistance: number;
}

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
