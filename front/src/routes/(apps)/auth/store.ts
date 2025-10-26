import { writable } from 'svelte/store';
import { getProfile } from './api';

interface AuthState {
    authenticated: boolean;
    user?: any;
    loading: boolean;
}

export const auth = writable<AuthState>({
    authenticated: false,
    user: undefined,
    loading: true
});

export async function checkAuth() {
    try {
        const profile = await getProfile();
        auth.set({
            authenticated: profile.status === 'logged_in',
            user: profile.user,
            loading: false
        });
        console.log(`Updated profile store:`);
        console.log(profile);
    } catch (error) {
        console.log('Failed getting profile to update store');
        console.log(error);
        auth.set({
            authenticated: false,
            user: undefined,
            loading: false
        });
    }
}
