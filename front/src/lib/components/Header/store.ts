import { writable } from 'svelte/store';
import type { PageMetadata } from './types';

export const pageMetadataStore = writable<PageMetadata>({
    name: 'My apps',
    iconPath: '/favicon.png',
    showAuthInHeader: true
});
export const showLoginSuccess = writable<boolean>(false);
