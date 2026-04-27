import { getApiUrl } from '$lib/helpers';
import { client2 } from '$lib/api';
import { authStore } from './store';

export const startGoogleOAuthFlow = (): void => {
    window.location.href = `${getApiUrl()}/youtube/auth/start`;
};

export const logoutGoogle = async (): Promise<void> => {
    await client2.youtube.authLogout({});
    authStore.set({ status: 'unauthenticated', subscriptions: [], error: null });
};
