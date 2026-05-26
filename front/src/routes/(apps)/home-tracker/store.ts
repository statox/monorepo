import type { TimeWindow } from '$lib/HomeTracker';
import { writable } from 'svelte/store';

const DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_TIME_WINDOW: TimeWindow = {
    startDateMs: Date.now() - DAY_MS,
    endDateMs: Date.now()
};

const parseStoredTimeWindow = (): TimeWindow => {
    const stored = localStorage.getItem('selectedTimeWindow');
    if (!stored) return DEFAULT_TIME_WINDOW;
    try {
        const parsed: unknown = JSON.parse(stored);
        if (typeof parsed === 'string') return DEFAULT_TIME_WINDOW;
        if (
            parsed !== null &&
            typeof parsed === 'object' &&
            'startDateMs' in parsed &&
            'endDateMs' in parsed &&
            typeof (parsed as TimeWindow).startDateMs === 'number' &&
            typeof (parsed as TimeWindow).endDateMs === 'number'
        ) {
            return parsed as TimeWindow;
        }
    } catch {
        // ignore malformed JSON
    }
    return DEFAULT_TIME_WINDOW;
};

export const selectedTimeWindow = writable<TimeWindow>(parseStoredTimeWindow());

selectedTimeWindow.subscribe((value) => {
    localStorage.setItem('selectedTimeWindow', JSON.stringify(value));
});
