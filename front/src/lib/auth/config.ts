import {
    PUBLIC_AUTH0_AUDIENCE,
    PUBLIC_AUTH0_CALLBACK,
    PUBLIC_AUTH0_CLIENT_ID,
    PUBLIC_AUTH0_DOMAIN
} from '$env/static/public';

const config = {
    domain: PUBLIC_AUTH0_DOMAIN,
    clientId: PUBLIC_AUTH0_CLIENT_ID,
    audience: PUBLIC_AUTH0_AUDIENCE,
    callback: PUBLIC_AUTH0_CALLBACK
};

export default config;
