import { writable } from 'svelte/store';
import type { PageMetadata } from './types';

export const pageMetadataStore = writable<PageMetadata>({
    name: 'My apps',
    iconPath: '/favicon.png'
});
export const showLoginSuccess = writable<boolean>(false);
