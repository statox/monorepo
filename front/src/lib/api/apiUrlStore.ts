import { browser } from '$app/environment';
import { writable, get } from 'svelte/store';
import { logout } from '$lib/auth/api';

export type ApiUrlType = 'prod' | 'local';

const STORAGE_KEY = 'apiUrlType';
const DEFAULT_VALUE: ApiUrlType = 'prod';

// Create a writable store that syncs to localStorage
function createApiUrlStore() {
    // Initialize with default value
    let initialValue = DEFAULT_VALUE;

    // In browser, check localStorage for stored value
    if (browser) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                initialValue = JSON.parse(stored) as ApiUrlType;
            } catch (e) {
                // If parsing fails, use default
                initialValue = DEFAULT_VALUE;
            }
        }
    }

    const store = writable<ApiUrlType>(initialValue);

    // Subscribe to store changes and sync to localStorage
    if (browser) {
        store.subscribe((value) => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        });
    }

    return store;
}

export const apiUrlTypeStore = createApiUrlStore();

export const toggleApiUrl = async () => {
    const currentType = get(apiUrlTypeStore);
    const newType: ApiUrlType = currentType === 'prod' ? 'local' : 'prod';

    // Update the store
    apiUrlTypeStore.set(newType);

    // Logout to clear any auth state
    try {
        await logout();
    } catch (error) {
        // Ignore logout errors, we're switching APIs anyway
        console.error('Error during logout:', error);
    }

    // Reload the page to ensure clean state
    window.location.reload();
};
