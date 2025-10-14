import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { Auth0Client, User, createAuth0Client } from '@auth0/auth0-spa-js';
import { get, writable } from 'svelte/store';
import config from './config';
import { UserLoggedOutError } from './errors';

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
        cacheLocation: 'localstorage',
        // Testing refresh tokens to see if it helps with disconnections.
        // Not sure this is immplemented properly
        useRefreshTokens: true
    });
    auth0Client.set(client);

    // Handle callback from Auth0
    const search = window.location.search;
    if ((search.includes('code=') || search.includes('error=')) && search.includes('state=')) {
        const { appState } = await get(auth0Client).handleRedirectCallback();
        window.history.replaceState({}, document.title, window.location.pathname);

        // For some reason even when the svelte/no-navigation-without-resolve rule is
        // disabled in eslint.config.mjs this line still raise an error. Not sure why.
        // eslint-disable-next-line svelte/no-navigation-without-resolve
        goto(appState.returnTo || '/');
    }

    const isAuthenticated = await get(auth0Client).isAuthenticated();
    if (isAuthenticated) {
        user.set(await get(auth0Client).getUser());
    } else {
        user.set(undefined);
    }

    refreshUserPeriodically();
};

export const login = () => {
    const url = get(page).url.pathname;
    get(auth0Client).loginWithRedirect({
        appState: { returnTo: url }
    });
};
export const logout = () => get(auth0Client).logout();

export const getAccessToken = async () => {
    try {
        const token = await get(auth0Client)?.getTokenSilently();
        user.set(await get(auth0Client).getUser());
        return token;
    } catch (error) {
        user.set(undefined);
        throw new UserLoggedOutError();
    }
};

// Experiment to see if I manage to logged out in the UI when I don't use the
// app for long enough
// (Current issue is that on mobile when I open the app the user's picture is
// stil in the header but when makin a call I'm logged out)
const refreshUserPeriodically = async () => {
    try {
        const token = await get(auth0Client)?.getTokenSilently();
        user.set(await get(auth0Client).getUser());
        return token;
    } catch (error) {
        user.set(undefined);
    }

    setTimeout(refreshUserPeriodically, 1000 * 60 * 5);
};
