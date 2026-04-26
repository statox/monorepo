import { writable } from 'svelte/store';
import type { AuthState } from './types';

const initialState: AuthState = {
    status: 'unauthenticated',
    token: null,
    subscriptions: [],
    error: null
};

export const authStore = writable<AuthState>(initialState);
