import { writable } from 'svelte/store';

export const pageNameStore = writable<string>('My apps');
