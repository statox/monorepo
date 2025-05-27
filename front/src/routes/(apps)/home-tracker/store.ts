import type { TimeWindow } from '$lib/HomeTracker';
import { writable } from 'svelte/store';

const selectedTimeWindowStr = localStorage.getItem('selectedTimeWindow');
const selectedTimeWindowInitValue = (selectedTimeWindowStr || '1d') as TimeWindow;
export const selectedTimeWindow = writable<TimeWindow>(selectedTimeWindowInitValue);

selectedTimeWindow.subscribe((value) => {
    localStorage.setItem('selectedTimeWindow', value);
});
