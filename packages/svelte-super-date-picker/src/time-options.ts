import type { DurationRange, RefreshUnitsOptions, TimeUnitAllId, TimeUnitId } from './types.js';

export const LAST = 'last';
export const NEXT = 'next';

export interface SelectOption {
    value: string;
    text: string;
}

export interface RelativeOption {
    value: TimeUnitAllId;
    text: string;
}

export const timeTenseOptions: SelectOption[] = [
    { value: LAST, text: 'Last' },
    { value: NEXT, text: 'Next' }
];

export const timeUnitsOptions: SelectOption[] = [
    { value: 's', text: 'Seconds' },
    { value: 'm', text: 'Minutes' },
    { value: 'h', text: 'Hours' },
    { value: 'd', text: 'Days' },
    { value: 'w', text: 'Weeks' },
    { value: 'M', text: 'Months' },
    { value: 'y', text: 'Years' }
];

export const relativeOptions: RelativeOption[] = [
    { value: 's', text: 'Seconds ago' },
    { value: 'm', text: 'Minutes ago' },
    { value: 'h', text: 'Hours ago' },
    { value: 'd', text: 'Days ago' },
    { value: 'w', text: 'Weeks ago' },
    { value: 'M', text: 'Months ago' },
    { value: 'y', text: 'Years ago' },
    { value: 's+', text: 'Seconds from now' },
    { value: 'm+', text: 'Minutes from now' },
    { value: 'h+', text: 'Hours from now' },
    { value: 'd+', text: 'Days from now' },
    { value: 'w+', text: 'Weeks from now' },
    { value: 'M+', text: 'Months from now' },
    { value: 'y+', text: 'Years from now' }
];

export const relativeRoundingLabels: Record<TimeUnitId, string> = {
    s: 'Round to the second',
    m: 'Round to the minute',
    h: 'Round to the hour',
    d: 'Round to the day',
    w: 'Round to the week',
    M: 'Round to the month',
    y: 'Round to the year'
};

export const refreshUnitsOptions: { value: RefreshUnitsOptions; text: string }[] =
    timeUnitsOptions.filter(
        (option): option is { value: RefreshUnitsOptions; text: string } =>
            option.value === 'h' || option.value === 'm' || option.value === 's'
    );

export const commonDurationRanges: DurationRange[] = [
    { start: 'now/d', end: 'now/d', label: 'Today' },
    { start: 'now/w', end: 'now/w', label: 'This week' },
    { start: 'now/M', end: 'now/M', label: 'This month' },
    { start: 'now/y', end: 'now/y', label: 'This year' },
    { start: 'now-1d/d', end: 'now-1d/d', label: 'Yesterday' },
    { start: 'now/w', end: 'now', label: 'Week to date' },
    { start: 'now/M', end: 'now', label: 'Month to date' },
    { start: 'now/y', end: 'now', label: 'Year to date' }
];
