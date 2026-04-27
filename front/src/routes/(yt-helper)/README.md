# YT Helper

A POC for authenticating with Google via OAuth 2.0 PKCE and fetching a user's YouTube subscriptions using the YouTube Data API v3.

## Route

`/yt-helper` → `src/routes/(yt-helper)/yt-helper/+page.svelte`

The `(yt-helper)` route group has its own minimal layout (`+layout.svelte`) that applies the base CSS without the app header or auth guard used by the main `(apps)` group.

## How it works

### 1. OAuth 2.0 PKCE flow (`src/lib/YtHelper/auth.ts`)

The page uses the Authorization Code flow with PKCE (Proof Key for Code Exchange), which is the correct pattern for browser-based clients.

**On "Connect to YouTube" click → `startOAuthFlow()`:**

1. Generates a random code verifier (32 bytes, base64url-encoded) using `crypto.getRandomValues`
2. Derives a SHA-256 code challenge from the verifier using `crypto.subtle.digest`
3. Stores the verifier in `sessionStorage` (survives the redirect, cleared on tab close)
4. Redirects the browser to `https://accounts.google.com/o/oauth2/v2/auth` with:
    - `response_type=code`
    - `scope=https://www.googleapis.com/auth/youtube.readonly`
    - `code_challenge_method=S256`
    - `code_challenge` (the SHA-256 hash)

**On redirect back to `/yt-helper?code=...` → `exchangeCodeForToken(code)`:**

1. Reads the verifier from `sessionStorage` and removes it
2. POSTs to `https://oauth2.googleapis.com/token` with the code, verifier, client ID, and client secret
3. Returns the access token from the response

> **Note:** Google's "Web application" credential type requires `client_secret` in the token exchange even when PKCE is used. This is a Google-specific requirement that deviates from the OAuth 2.1 spec (which treats PKCE as sufficient for public clients). In a production app, this token exchange must happen server-side to keep the secret out of the browser bundle.

**On "Disconnect" click → `clearAuth()`:**

- Clears the verifier from `sessionStorage`
- Resets the auth store to `unauthenticated`

### 2. Auth state (`src/lib/YtHelper/store.ts`)

A single Svelte writable store holds the entire auth state:

```typescript
type AuthState = {
    status: 'unauthenticated' | 'loading' | 'authenticated';
    token: string | null; // access token, in-memory only
    subscriptions: string[]; // channel titles
    error: string | null;
};
```

The token is intentionally kept in-memory (not persisted to `localStorage`) — it is lost on page refresh, which is the safe default.

### 3. YouTube API (`src/lib/YtHelper/api.ts`)

`fetchSubscriptions(token)` calls the YouTube Data API v3 subscriptions endpoint:

```
GET https://www.googleapis.com/youtube/v3/subscriptions
    ?part=snippet&mine=true&maxResults=50
Authorization: Bearer <access_token>
```

Returns a `string[]` of channel titles from `items[].snippet.title`.

### 4. Page component (`+page.svelte`)

`onMount` checks for a `?code=` URL parameter (the OAuth callback). If found:

- Strips it from the URL immediately via `history.replaceState` (so it's not visible or reusable)
- Checks `sessionStorage` for the PKCE verifier — if missing (e.g. the user refreshed mid-flow), shows an error instead of attempting the exchange
- Calls `exchangeCodeForToken` then `fetchSubscriptions` in sequence
- Updates the store with the result or an error message

The UI renders one of three states driven by `$authStore.status`:

| Status            | UI                                                       |
| ----------------- | -------------------------------------------------------- |
| `unauthenticated` | "Connect to YouTube" button (+ error message if present) |
| `loading`         | "Loading..." text                                        |
| `authenticated`   | Subscription list + "Disconnect" button                  |

## Environment variables

| Variable                       | File                    | Purpose                                                              |
| ------------------------------ | ----------------------- | -------------------------------------------------------------------- |
| `PUBLIC_YOUTUBE_CLIENT_ID`     | `env.local`, `env.prod` | OAuth client ID from Google Cloud Console                            |
| `PUBLIC_YOUTUBE_CLIENT_SECRET` | `env.local`, `env.prod` | OAuth client secret (POC only — must move server-side in production) |

See `superpowers/specs/2026-04-26-yt-helper-google-setup-guide.md` for full setup instructions.

## Known limitations (POC)

- No refresh token — the access token expires after 1 hour
- No `state` parameter — production must add this for CSRF protection
- `client_secret` is in the browser bundle — production must proxy the token exchange through a backend
- Only fetches the first 50 subscriptions — production should paginate via `nextPageToken`
