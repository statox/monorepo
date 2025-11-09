import { requestAPIPost } from '$lib/api';

import { writable } from 'svelte/store';

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
        data: {},
        isUnauthenticatedCall: true
    });

/*
 * service
 */
export const login = async (username: string, password: string) => {
    await requestAPIPost<void>({
        path: '/auth/login',
        data: { username, password },
        isUnauthenticatedCall: true
    });
    await updateProfile();
};

export const logout = async () => {
    await requestAPIPost<void>({
        path: '/auth/logout',
        data: {},
        isUnauthenticatedCall: true
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
