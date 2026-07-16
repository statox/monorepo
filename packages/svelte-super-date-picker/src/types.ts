export type NowDateMode = 'now';
export type AbsoluteDateMode = 'absolute';
export type RelativeDateMode = 'relative';
export type DateMode = NowDateMode | AbsoluteDateMode | RelativeDateMode;

/**
 * Either datemath (e.g. 'now', 'now-15m', 'now-15m/m') or an absolute
 * ISO 8601 date string.
 */
export type ShortDate = NowDateMode | string;

export type Milliseconds = number;

export type TimeUnitId = 's' | 'm' | 'h' | 'd' | 'w' | 'M' | 'y';
export type TimeUnitFromNowId = 's+' | 'm+' | 'h+' | 'd+' | 'w+' | 'M+' | 'y+';
export type TimeUnitAllId = TimeUnitId | TimeUnitFromNowId;

export interface RelativeParts {
    count: number;
    round: boolean;
    roundUnit?: TimeUnitId;
    unit: string;
}

export interface DurationRange {
    start: ShortDate;
    end: ShortDate;
    label?: string;
}

export const REFRESH_UNIT_OPTIONS = ['s', 'm', 'h'] as const;
export type RefreshUnitsOptions = (typeof REFRESH_UNIT_OPTIONS)[number];

export interface QuickSelect {
    timeTense: 'last' | 'next';
    timeValue: number;
    timeUnits: TimeUnitId;
}

export interface TimeRangeMs {
    startDateMs: Milliseconds;
    endDateMs: Milliseconds;
}

export interface OnTimeChangeProps extends TimeRangeMs {
    start: ShortDate;
    end: ShortDate;
    isInvalid: boolean;
    isQuickSelection: boolean;
}

export interface OnRefreshProps extends TimeRangeMs {
    refreshInterval: Milliseconds;
}

export interface OnRefreshChangeProps {
    isPaused: boolean;
    refreshInterval: Milliseconds;
    intervalUnits: RefreshUnitsOptions;
}
