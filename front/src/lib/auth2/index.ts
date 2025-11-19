import { PRNG } from 'simple-prng';
import { client2 } from '$lib/api';

import { writable } from 'svelte/store';
const rng = new PRNG();

/*
 * Store
 */
export const user = writable<UserProfile | undefined>();

/*
 * API
 */
// List of possible scopes
export type Scope = 'admin' | 'public' | 'homeTracker';

export type User = {
    id: number;
    username: string;
    scopes: Scope[];
};
export type UserProfile = {
    status: 'logged_out' | 'logged_in';
    user: User;
};

export const getProfile = client2.auth.me;

/*
 * service
 */
export const login = async (username: string, password: string) => {
    await client2.auth.login({ username, password });
    await updateProfile();
};

export const logout = async () => {
    await client2.auth.logout({});
    await updateProfile();
};

// Exported only for /auth/me we can probably rework to avoid export
export const updateProfile = async () => {
    try {
        const profile = await getProfile({});
        if (profile.status === 'logged_in') {
            user.set(profile);
        } else {
            user.set(undefined);
        }
    } catch (error) {
        user.set(undefined);
    }
};

export const checkAuth = async () => {
    try {
        const profile = await getProfile({});
        if (profile.status === 'logged_in') {
            user.set(profile);
        } else {
            user.set(undefined);
        }
    } catch (error) {
        user.set(undefined);
    }
};

export const isAllowedForUser = (scope: Scope, userProfile: UserProfile | undefined) => {
    if (!userProfile) {
        return false;
    }

    if (userProfile.user.scopes.includes('admin')) {
        return true;
    }
    return userProfile.user.scopes.includes(scope);
};

const stringToSeed = (str: string) => {
    return str.split('').reduce((total, letter, i) => {
        return total + (i + 1) * letter.charCodeAt(0);
    }, 1);
};

export const usernameToColor = (username: string | undefined) => {
    if (!username) {
        return '#990000';
    }

    const seed = stringToSeed(username);
    rng.initialize(seed);

    const R = Math.floor(rng.random() * 255)
        .toString(16)
        .padStart(2, '0');
    const G = Math.floor(rng.random() * 255)
        .toString(16)
        .padStart(2, '0');
    const B = Math.floor(rng.random() * 255)
        .toString(16)
        .padStart(2, '0');

    return `#${R}${G}${B}`;
};
