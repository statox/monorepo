# YT Helper — follow-ups for branch `test-yt-api`

---

## 1. Update `front/src/routes/(yt-helper)/README.md`

The README still describes the old PKCE flow (`auth.ts`, `sessionStorage`, `exchangeCodeForToken`, `PUBLIC_YOUTUBE_CLIENT_SECRET` in the browser bundle, etc.). The entire "How it works" section needs to be rewritten to reflect the current server-side OAuth flow:

- Step 1: frontend navigates to `GET /youtube/auth/start` → server redirects to Google
- Step 2: Google redirects to `/youtube/auth/callback` → server exchanges the code, stores the access token in the session, redirects to the frontend
- Step 3: frontend calls `GET /youtube/auth/status` to check if authentication succeeded
- Step 4: frontend calls `GET /youtube/subscriptions` to fetch data
- Step 5: frontend calls `POST /youtube/auth/logout` to clear the session

Env vars section: `PUBLIC_YOUTUBE_CLIENT_ID` and `PUBLIC_YOUTUBE_CLIENT_SECRET` no longer live in the frontend. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are backend env vars now. The frontend section can likely be removed or reduced to just the API URL.

---

## 2. Improve `back/tests/routes/youtube/`

### 2a. Missing happy-path tests for existing suites

**`authStatus`** — only tests the unauthenticated case. Add a case where `req.session.googleAccessToken` is pre-populated (via a test helper that injects a session cookie containing the token) and verify the response is `{ authenticated: true }`.

**`getSubscriptions`** — only tests 401 when unauthenticated. Add a happy-path case: inject a session with a fake token, stub `fetchSubscriptions` (or the underlying `fetch` call), and verify the response shape matches the output schema.

### 2b. Missing test suites

There are no tests at all for `authStart`, `authCallback`, and `authLogout`. At minimum:

- **`authStart`**: `GET /youtube/auth/start` should return 302 with a `Location` pointing to `accounts.google.com`. This is already covered in `tests/framework/auth.test.ts` but having it in the route-level suite would be more discoverable.
- **`authLogout`**: inject a session with a token, call `POST /youtube/auth/logout`, verify response is `{}` and that a subsequent call to `GET /youtube/auth/status` returns `{ authenticated: false }`.
- **`authCallback`**: hardest to test — see 2c below.

### 2c. End-to-end OAuth callback (needs investigation)

The `authCallback` route is the most valuable to test but also the hardest:

- `doGoogleOAuthCallback` (passport-oauth2) makes a real HTTP POST to `https://oauth2.googleapis.com/token` to exchange the authorization code.
- To test this without real credentials, the token endpoint needs to be intercepted.

**Options to investigate:**

1. **`nock`** — HTTP-level interceptor for Node.js. Intercept `https://oauth2.googleapis.com/token` and return a fake `{ access_token: 'fake-token', token_type: 'Bearer' }`. Then call `GET /youtube/auth/callback?code=fake-code&state=...` (the `state` parameter is managed internally by passport's session store — look at what `doGoogleOAuthStart` stores in the session to reproduce it).

2. **Stub the strategy** — sinon-stub `passport.authenticate` for the `'google'` strategy so `doGoogleOAuthCallback` immediately calls `next()` with `req.user = { accessToken: 'fake-token' }`, then verify `storeGoogleTokenAndRedirect` saves it and redirects.

Option 2 is simpler to set up but tests less. Option 1 is closer to a real integration test. The state/session handling for the callback state parameter is the tricky part — worth studying how passport-oauth2 stores and verifies `state` before committing to an approach.

---

## 3. `front/src/lib/YtHelper/googleAuth.ts` — `startGoogleOAuthFlow`

Current code:

```typescript
export const startGoogleOAuthFlow = (): void => {
    window.location.href = `${getApiUrl()}/youtube/auth/start`;
};
```

This works correctly (OAuth requires a real browser navigation, not a fetch), but it bypasses the SDK entirely and hard-codes the path construction.

### The question

Should the SDK handle this, and if so, how?

**Option A — SDK exposes a URL helper, caller does the redirect:**
```typescript
// In the SDK (hand-edited or generated special case):
authStartUrl: (): string => `${this.baseURL}/youtube/auth/start`

// In googleAuth.ts:
window.location.href = client2.youtube.authStartUrl();
```
Pros: path construction is centralised in the SDK; if the path ever changes, only one place to update. Cons: the SDK currently only exposes async data-fetching methods; adding a sync URL builder is a pattern change.

**Option B — SDK does the navigation:**
```typescript
authStart: (): void => { window.location.href = `${this.baseURL}/youtube/auth/start`; }
```
Pros: caller is very simple. Cons: SDK with side effects (`window.location`) is unusual and untestable; breaks SSR environments.

**Option C — keep as-is but use the SDK's `baseURL`:**
```typescript
import { client2 } from '$lib/api';
window.location.href = `${client2.baseURL}/youtube/auth/start`;
```
Pros: minimal change, removes the `getApiUrl()` duplication. Cons: `baseURL` may not be a public field on the client.

**Recommendation:** Option A is the cleanest — a URL accessor keeps the SDK as the single source of truth for the API surface without introducing side effects. This would require either a manual addition to the SDK or a change to the SDK generator to emit URL accessors for redirect-based routes. Worth deciding whether the generator should be extended before implementing.
