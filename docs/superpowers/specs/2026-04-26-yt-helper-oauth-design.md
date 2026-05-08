# YT Helper - YouTube OAuth 2 POC Design

**Date:** 2026-04-26
**Scope:** POC to learn OAuth 2 PKCE + YouTube Data API v3 for a future production feature.

---

## Goal

Authenticate a user with their Google account via OAuth 2 PKCE and display their raw YouTube subscription list (channel names only).

---

## Architecture

```
src/routes/(yt-helper)/
├── +layout.js               prerender = true
├── +layout.svelte           minimal layout (no header/auth required)
└── yt-helper/
    └── +page.svelte         three UI states: unauthenticated / loading / authenticated

src/lib/YtHelper/
├── auth.ts                  PKCE OAuth flow
├── api.ts                   YouTube API calls
├── store.ts                 Svelte writable for auth + subscription state
└── types.ts                 TypeScript types
```

---

## OAuth Flow (PKCE, Authorization Code)

1. User clicks "Connect to YouTube"
2. `startOAuthFlow()`:
   - Generates a cryptographically random code verifier (43-128 chars, URL-safe, via `crypto.getRandomValues`)
   - Derives SHA-256 code challenge from the verifier
   - Saves the verifier to `sessionStorage`
   - Redirects to Google's auth endpoint with:
     - `response_type=code`
     - `client_id` from `VITE_YOUTUBE_CLIENT_ID`
     - `redirect_uri` = current origin + `/yt-helper`
     - `scope=https://www.googleapis.com/auth/youtube.readonly`
     - `code_challenge_method=S256`
     - `code_challenge`
3. Google redirects back to `/yt-helper?code=...`
4. `+page.svelte` detects the `code` URL param on mount
5. `exchangeCodeForToken(code)`:
   - Reads verifier from `sessionStorage`
   - POSTs to `https://oauth2.googleapis.com/token` with `grant_type=authorization_code`
   - Returns access token string
   - Clears `code` from the URL (replaceState)
6. Token stored in Svelte store (in-memory only)
7. `fetchSubscriptions(token)` calls YouTube API, returns `string[]` of channel titles
8. Page renders the list

---

## Module Details

### `auth.ts`

```typescript
startOAuthFlow(): void
exchangeCodeForToken(code: string): Promise<string>
clearToken(): void
```

### `store.ts`

```typescript
type AuthState = {
    status: 'unauthenticated' | 'loading' | 'authenticated';
    token: string | null;
    subscriptions: string[];
    error: string | null;
}
```

### `api.ts`

```typescript
fetchSubscriptions(token: string): Promise<string[]>
// GET https://www.googleapis.com/youtube/v3/subscriptions
// params: part=snippet, mine=true, maxResults=50
```

### `types.ts`

Types for the raw Google token response and YouTube subscription API response.

---

## Environment Configuration

Add to `env.local` and `env.prod`:

```
VITE_YOUTUBE_CLIENT_ID=your_client_id_here
```

The `VITE_` prefix follows the existing convention and makes the variable available in the browser bundle via `import.meta.env`.

---

## UI States

| State | Display |
|---|---|
| `unauthenticated` | "Connect to YouTube" button |
| `loading` | Spinner |
| `authenticated` | Plain `<ul>` of channel names + "Disconnect" button |
| error | Inline error message |

---

## Error Handling

- Token exchange fails (network, invalid code): set status to `unauthenticated`, show toast
- `fetchSubscriptions` fails (expired token, quota): show inline error on the page
- `code` param present but no verifier in `sessionStorage` (mid-flow refresh): treat as unauthenticated, clean URL

---

## Security Notes

- **PKCE** is the correct OAuth 2.1 pattern for public clients (no client secret)
- **`sessionStorage`** for the code verifier: cleared on tab close, not shared across tabs
- **In-memory token** (Svelte store): lost on page refresh, not persisted - correct default for security
- **Redirect URI** must be registered exactly in Google Cloud Console for both dev and prod origins

---

## Known POC Limitations (to address in production)

| Limitation | Production fix |
|---|---|
| No `state` parameter | Add random `state` to prevent CSRF, verify on callback |
| No refresh token | Request `access_type=offline`, store + use refresh token |
| Token lost on refresh | Persist token securely (encrypted localStorage or server-side session) |
| Client ID visible in JS bundle | Acceptable for public OAuth clients; no client secret is used |
| Single page of subscriptions | Implement pagination via `nextPageToken` |

---

## Setup Requirements

1. Create a Google Cloud project
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials (Web application type)
4. Add authorized redirect URIs:
   - `https://localhost:5173/yt-helper` (dev)
   - `https://statox.github.io/yt-helper` (prod, adjust as needed)
5. Copy client ID to `env.local` as `VITE_YOUTUBE_CLIENT_ID`
