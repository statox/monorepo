import { get, writable } from 'svelte/store';
import config from './config';
import { createAuth0Client } from '@auth0/auth0-spa-js';

const auth0Client = writable<any>();
const isAuthenticated = writable(false);
const isLoading = writable(true);
export const user = writable<any | null>(null);
const error = writable<unknown>();

export const initializeAuth0 = async () => {
    auth0Client.set(
        await createAuth0Client({
            domain: config.domain,
            clientId: config.clientId,
            authorizationParams: {
                redirect_uri: config.callback,
                audience: config.audience
            }
        })
    );

    const onRedirectCallback = () =>
        window.history.replaceState({}, document.title, window.location.pathname);

    try {
        const search = window.location.search;

        if ((search.includes('code=') || search.includes('error=')) && search.includes('state=')) {
            await get(auth0Client).handleRedirectCallback();

            onRedirectCallback();
        }
    } catch (err) {
        error.set(err);
    } finally {
        isAuthenticated.set(await get(auth0Client).isAuthenticated());
        user.set((await get(auth0Client).getUser()) || null);
        isLoading.set(false);
    }
};

export const login = async () => {
    await get(auth0Client).loginWithRedirect();
};

export const logout = async () => {
    get(auth0Client).logout();
};

export const getAccessToken = async () => {
    const token = await get(auth0Client).getTokenSilently();
    console.log(token);
    return token;
};
