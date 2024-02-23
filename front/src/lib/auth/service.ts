import { get, writable } from 'svelte/store';
import { toast } from '$lib/components/Toast';
import config from './config';
import { Auth0Client, User, createAuth0Client } from '@auth0/auth0-spa-js';

const auth0Client = writable<Auth0Client>();
export const user = writable<User | undefined>();

// https://auth0.com/docs/quickstart/spa/vanillajs/interactive
export const initializeAuth0 = async () => {
    // If a user has previously logged in, the client will refresh the authentication state on page load;
    // the user will still be logged in once the page is refreshed.
    const client = await createAuth0Client({
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
        // Testing refresh tokens to see if it helps with disconnections.
        // Not sure this is immplemented properly
        // useRefreshTokens: true
    });
    auth0Client.set(client);

    // Handle callback from Auth0
    const search = window.location.search;
    if ((search.includes('code=') || search.includes('error=')) && search.includes('state=')) {
        await get(auth0Client).handleRedirectCallback();
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const isAuthenticated = await get(auth0Client).isAuthenticated();
    if (isAuthenticated) {
        user.set(await get(auth0Client).getUser());
    } else {
        user.set(undefined);
    }
};

export const login = () => get(auth0Client).loginWithRedirect();
export const logout = () => get(auth0Client).logout();

export const getAccessToken = async () => {
    try {
        return get(auth0Client)?.getTokenSilently();
    } catch (error) {
        user.set(undefined);
        toast.push(`getAccessToken error\n${(error as Error).message}`, {
            duration: 5000,
            theme: {
                '--toastBarHeight': 0
            }
        });
    }
};
