import { writable } from 'svelte/store';

export const pageNameStore = writable<string>('My apps');
export const showLoginSuccess = writable<boolean>(false);
