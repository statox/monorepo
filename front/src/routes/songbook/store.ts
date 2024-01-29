import { writable } from 'svelte/store';
import type { ChordData } from '$lib/Songbook/types';

export const visitCountsStore = writable<Map<string, ChordData>>();
