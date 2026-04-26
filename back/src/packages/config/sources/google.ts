import { isProd } from './env.js';

export const GOOGLE_CLIENT_ID = isProd ? process.env.GOOGLE_CLIENT_ID! : 'dummy-google-client-id';
export const GOOGLE_CLIENT_SECRET = isProd
    ? process.env.GOOGLE_CLIENT_SECRET!
    : 'dummy-google-client-secret';
export const GOOGLE_CALLBACK_URL = isProd
    ? 'https://api.statox.fr/youtube/auth/callback'
    : 'http://localhost:3000/youtube/auth/callback';
export const GOOGLE_FRONTEND_REDIRECT_URL = isProd
    ? 'https://apps.statox.fr/yt-helper'
    : 'https://localhost:8080/yt-helper';
