import { client2 } from '$lib/api';
import { user } from './store';

export const getProfile = client2.auth.me;

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
