import { PUBLIC_YOUTUBE_CLIENT_ID, PUBLIC_YOUTUBE_CLIENT_SECRET } from '$env/static/public';
import { authStore } from './store';
import type { TokenResponse } from './types';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';
const VERIFIER_KEY = 'yt_pkce_verifier';

function base64urlEncode(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64urlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return base64urlEncode(new Uint8Array(digest));
}

export async function startOAuthFlow(): Promise<void> {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    sessionStorage.setItem(VERIFIER_KEY, verifier);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: PUBLIC_YOUTUBE_CLIENT_ID,
        redirect_uri: `${window.location.origin}/yt-helper`,
        scope: SCOPE,
        code_challenge_method: 'S256',
        code_challenge: challenge
    });

    window.location.href = `${AUTH_ENDPOINT}?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    if (!verifier) {
        throw new Error('No PKCE code verifier found — the OAuth flow may have been interrupted');
    }
    sessionStorage.removeItem(VERIFIER_KEY);

    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: PUBLIC_YOUTUBE_CLIENT_ID,
            client_secret: PUBLIC_YOUTUBE_CLIENT_SECRET,
            redirect_uri: `${window.location.origin}/yt-helper`,
            code_verifier: verifier
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Token exchange failed (${response.status}): ${text}`);
    }

    const data: TokenResponse = await response.json();
    return data.access_token;
}

export function clearAuth(): void {
    sessionStorage.removeItem(VERIFIER_KEY);
    authStore.set({ status: 'unauthenticated', token: null, subscriptions: [], error: null });
}
