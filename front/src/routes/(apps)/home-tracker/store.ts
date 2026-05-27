import type { TimeWindow } from '$lib/HomeTracker';
import { writable } from 'svelte/store';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const unitMs: Record<string, number> = {
    minute: MINUTE,
    hour: HOUR,
    day: DAY,
    month: 30 * DAY,
    year: 365 * DAY
};

export interface TimeWindowSelection {
    value: number;
    unit: string;
}

export const toTimeWindow = ({ value, unit }: TimeWindowSelection): TimeWindow => {
    const now = Date.now();
    return { startDateMs: now - value * unitMs[unit], endDateMs: now };
};

const DEFAULT_SELECTION: TimeWindowSelection = { value: 1, unit: 'day' };

const parseStoredSelection = (): TimeWindowSelection => {
    const stored = localStorage.getItem('selectedTimeWindowSelection');
    if (!stored) return DEFAULT_SELECTION;
    try {
        const parsed: unknown = JSON.parse(stored);
        if (
            parsed !== null &&
            typeof parsed === 'object' &&
            'value' in parsed &&
            'unit' in parsed &&
            typeof (parsed as TimeWindowSelection).value === 'number' &&
            typeof (parsed as TimeWindowSelection).unit === 'string' &&
            (parsed as TimeWindowSelection).unit in unitMs
        ) {
            return parsed as TimeWindowSelection;
        }
    } catch {
        // ignore malformed JSON
    }
    return DEFAULT_SELECTION;
};

export const selectedTimeWindowSelection = writable<TimeWindowSelection>(parseStoredSelection());

selectedTimeWindowSelection.subscribe((value) => {
    localStorage.setItem('selectedTimeWindowSelection', JSON.stringify(value));
});

export const selectedTimeWindow = {
    get: () => {
        let selection: TimeWindowSelection = DEFAULT_SELECTION;
        selectedTimeWindowSelection.subscribe((v) => (selection = v))();
        return toTimeWindow(selection);
    }
};
