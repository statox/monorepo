import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'personalTrackerPassword';

function createPasswordStore() {
    const initialValue = browser ? sessionStorage.getItem(STORAGE_KEY) || '' : '';

    const { subscribe, set } = writable<string>(initialValue);

    return {
        subscribe,
        setPassword: (password: string) => {
            if (browser) {
                sessionStorage.setItem(STORAGE_KEY, password);
            }
            set(password);
        },
        clearPassword: () => {
            if (browser) {
                sessionStorage.removeItem(STORAGE_KEY);
            }
            set('');
        },
        isUnlocked: (password: string) => password.length > 0
    };
}

export const personalTrackerPassword = createPasswordStore();
