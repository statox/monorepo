import { writable } from 'svelte/store';
import type { ChordData } from './types';

export const visitCountsStore = writable<Map<string, ChordData>>();
