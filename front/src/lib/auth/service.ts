import { get, writable } from 'svelte/store';
import config from './config';
import { Auth0Client, User, createAuth0Client } from '@auth0/auth0-spa-js';

const auth0Client = writable<Auth0Client>();
const isAuthenticated = writable(false);
const isLoading = writable(true);
export const user = writable<User | null>(null);
const error = writable<unknown>();

export const initializeAuth0 = async () => {
    auth0Client.set(
        await createAuth0Client({
            domain: config.domain,
            clientId: config.clientId,
            authorizationParams: {
                redirect_uri: config.callback,
                audience: config.audience
            },
            // TODO: This is not secure as the token could be read by an attacker via XSS
            // https://auth0.com/docs/secure/security-guidance/data-security/token-storage#browser-local-storage-scenarios
            // But that allow to stay authorized after page refreshes
            cacheLocation: 'localstorage'
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
    get(auth0Client).loginWithRedirect();
};

export const logout = async () => {
    get(auth0Client).logout();
};

export const getAccessToken = async () => {
    return await get(auth0Client)?.getTokenSilently();
};
