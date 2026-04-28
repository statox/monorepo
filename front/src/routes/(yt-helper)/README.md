# YT Helper

A tool for authenticating with Google via a server-side OAuth 2.0 flow and fetching a user's YouTube subscriptions using the YouTube Data API v3.

## Route

`/yt-helper` → `src/routes/(yt-helper)/yt-helper/+page.svelte`

The `(yt-helper)` route group has its own minimal layout (`+layout.svelte`) that applies the base CSS without the app header or auth guard used by the main `(apps)` group.

## How it works

Authentication is handled entirely by the backend. The frontend holds no tokens — only a server-side session cookie keeps the user authenticated.

### OAuth flow

**1. User clicks "Connect to YouTube"**

`startGoogleOAuthFlow()` (`src/lib/YtHelper/googleAuth.ts`) navigates the browser to `GET /youtube/auth/start`. The server (passport-oauth2) immediately issues a 302 to Google's consent screen. This must be a real browser navigation, not a fetch, so the session cookie can be set on the redirect back.

**2. Google redirects back**

After the user grants consent, Google redirects to `GET /youtube/auth/callback?code=...`. The server exchanges the authorization code for an access token, stores it in the server-side session under `req.session.googleAccessToken`, and redirects the browser back to `/yt-helper`.

**3. Page loads, checks session**

`onMount` in `+page.svelte` calls `GET /youtube/auth/status` via `client2.youtube.authStatus()`. The server reads the session and returns `{ authenticated: true/false }`. If authenticated, the page immediately fetches subscriptions.

**4. Fetching subscriptions**

`fetchSubscriptions()` (`src/lib/YtHelper/api.ts`) calls `GET /youtube/subscriptions`. The server reads the access token from the session and forwards the request to the YouTube Data API — the token never reaches the browser.

**5. Disconnect**

`logoutGoogle()` calls `POST /youtube/auth/logout`. The server deletes `googleAccessToken` from the session. The store is reset to `unauthenticated`.

### Error handling

If step 2 fails (Google rejects the code exchange), the server redirects to `/yt-helper?error=auth_failed`. `onMount` detects this parameter, strips it from the URL, and shows an error message.

---

## Module overview

| File                                            | Responsibility                                                                          |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/lib/YtHelper/googleAuth.ts`                | `startGoogleOAuthFlow` (browser navigation to auth start) and `logoutGoogle` (API call) |
| `src/lib/YtHelper/api.ts`                       | `fetchSubscriptions` — wraps `client2.youtube.subscriptions()`                          |
| `src/lib/YtHelper/store.ts`                     | Svelte writable store holding `AuthState`                                               |
| `src/lib/YtHelper/types.ts`                     | `AuthState` and `AuthStatus` types                                                      |
| `src/routes/(yt-helper)/yt-helper/+page.svelte` | Page component — drives state transitions on mount and user interaction                 |

### Auth state (`AuthState`)

```typescript
type AuthState = {
    status: 'unauthenticated' | 'loading' | 'authenticated';
    subscriptions: Subscription[]; // populated once authenticated
    error: string | null;
};
```

The token is never stored client-side. Session state lives in the backend (MySQL sessions table) and is accessed via the session cookie.

### Page UI states

| Status            | UI                                                       |
| ----------------- | -------------------------------------------------------- |
| `unauthenticated` | "Connect to YouTube" button (+ error message if present) |
| `loading`         | "Loading..." text                                        |
| `authenticated`   | Subscription list + "Disconnect" button                  |
