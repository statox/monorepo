import { writable } from 'svelte/store';

const SHOW_METRICS_KEY = 'home-tracker-show-metrics';

const parseStoredValue = (): boolean => {
    const stored = localStorage.getItem(SHOW_METRICS_KEY);
    if (stored === null) return false;
    try {
        return JSON.parse(stored) as boolean;
    } catch {
        return false;
    }
};

export const showMetrics = writable<boolean>(parseStoredValue());

showMetrics.subscribe((value) => {
    localStorage.setItem(SHOW_METRICS_KEY, JSON.stringify(value));
});
