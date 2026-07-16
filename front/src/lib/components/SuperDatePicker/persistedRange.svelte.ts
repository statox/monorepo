import { localStore } from '$lib/localStore.svelte';
import type { DurationRange } from 'svelte-super-date-picker';

export function persistedDurationRange(storageKey: string, defaultRange: DurationRange) {
    return localStore<DurationRange>(`super-date-picker:${storageKey}`, defaultRange);
}
