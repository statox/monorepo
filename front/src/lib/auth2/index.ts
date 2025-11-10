import { PRNG } from 'simple-prng';
import { requestAPIPost } from '$lib/api';

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

export const getProfile = () =>
    requestAPIPost<UserProfile>({
        path: '/auth/me',
        data: {}
    });

/*
 * service
 */
export const login = async (username: string, password: string) => {
    await requestAPIPost<void>({
        path: '/auth/login',
        data: { username, password }
    });
    await updateProfile();
};

export const logout = async () => {
    await requestAPIPost<void>({
        path: '/auth/logout',
        data: {}
    });
    await updateProfile();
};

// Exported only for /auth/me we can probably rework to avoid export
export const updateProfile = async () => {
    try {
        user.set(await getProfile());
    } catch (error) {
        user.set(undefined);
    }
};

export const checkAuth = async () => {
    try {
        const profile = await getProfile();
        user.set(profile);
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
