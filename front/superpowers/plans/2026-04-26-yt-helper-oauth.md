# YT Helper OAuth POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an OAuth 2.0 PKCE flow in a new SvelteKit route that authenticates with Google and displays the user's YouTube subscription list.

**Architecture:** A new `(yt-helper)` route group with its own minimal layout hosts the page. All OAuth and API logic lives in `src/lib/YtHelper/` following the existing feature module pattern. The token is stored in-memory (Svelte store); the PKCE code verifier is stored in `sessionStorage` for the duration of the redirect round-trip.

**Tech Stack:** SvelteKit 2, Svelte 5 (runes), TypeScript strict mode, Web Crypto API (built-in), `$env/static/public` for env vars, Google OAuth 2.0 PKCE, YouTube Data API v3.

**Spec:** `superpowers/specs/2026-04-26-yt-helper-oauth-design.md`

**Validation commands:**

- `npm run check` — TypeScript + Svelte type checking
- `npm run lint` — ESLint

---

### Task 1: Add environment variable

**Files:**

- Modify: `env.local`
- Modify: `env.prod`

- [ ] **Step 1: Add the client ID placeholder to both env files**

In `env.local`, append:

```
PUBLIC_YOUTUBE_CLIENT_ID=your_client_id_here
```

In `env.prod`, append:

```
PUBLIC_YOUTUBE_CLIENT_ID=your_client_id_here
```

> You must replace `your_client_id_here` with a real client ID from Google Cloud Console before the OAuth flow will work. Setup steps are in the spec under "Setup Requirements".

- [ ] **Step 2: Verify SvelteKit picks up the new variable**

Run: `npm run check`
Expected: no new errors (the variable is not imported anywhere yet, so this just confirms the build config is healthy).

- [ ] **Step 3: Commit**

```bash
git add env.local env.prod
git commit -m "feat(yt-helper): add PUBLIC_YOUTUBE_CLIENT_ID env var"
```

---

### Task 2: Create route group layout

**Files:**

- Create: `src/routes/(yt-helper)/+layout.js`
- Create: `src/routes/(yt-helper)/+layout.svelte`

- [ ] **Step 1: Create `+layout.js`**

```js
export const prerender = true;
```

- [ ] **Step 2: Create `+layout.svelte`**

```svelte
<script lang="ts">
    import '$lib/styles/new.css';
    import '$lib/styles/new_theme.css';
    import '$lib/styles/new_override.css';
    import type { Snippet } from 'svelte';

    interface Props {
        children?: Snippet;
    }

    let { children }: Props = $props();
</script>

{@render children?.()}
```

- [ ] **Step 3: Run check**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/\(yt-helper\)/+layout.js src/routes/\(yt-helper\)/+layout.svelte
git commit -m "feat(yt-helper): add route group layout"
```

---

### Task 3: Create TypeScript types

**Files:**

- Create: `src/lib/YtHelper/types.ts`

- [ ] **Step 1: Create `types.ts`**

```typescript
export type AuthStatus = 'unauthenticated' | 'loading' | 'authenticated';

export interface AuthState {
    status: AuthStatus;
    token: string | null;
    subscriptions: string[];
    error: string | null;
}

export interface TokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

export interface SubscriptionItem {
    snippet: {
        title: string;
    };
}

export interface SubscriptionsResponse {
    items: SubscriptionItem[];
    nextPageToken?: string;
}
```

- [ ] **Step 2: Run check**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/YtHelper/types.ts
git commit -m "feat(yt-helper): add TypeScript types"
```

---

### Task 4: Create auth state store

**Files:**

- Create: `src/lib/YtHelper/store.ts`

- [ ] **Step 1: Create `store.ts`**

```typescript
import { writable } from 'svelte/store';
import type { AuthState } from './types';

const initialState: AuthState = {
    status: 'unauthenticated',
    token: null,
    subscriptions: [],
    error: null
};

export const authStore = writable<AuthState>(initialState);
```

- [ ] **Step 2: Run check**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/YtHelper/store.ts
git commit -m "feat(yt-helper): add auth state store"
```

---

### Task 5: Implement PKCE auth module

**Files:**

- Create: `src/lib/YtHelper/auth.ts`

- [ ] **Step 1: Create `auth.ts`**

```typescript
import { PUBLIC_YOUTUBE_CLIENT_ID } from '$env/static/public';
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
```

- [ ] **Step 2: Run check**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/YtHelper/auth.ts
git commit -m "feat(yt-helper): implement PKCE OAuth flow"
```

---

### Task 6: Implement YouTube API module

**Files:**

- Create: `src/lib/YtHelper/api.ts`

- [ ] **Step 1: Create `api.ts`**

```typescript
import type { SubscriptionsResponse } from './types';

const SUBSCRIPTIONS_ENDPOINT = 'https://www.googleapis.com/youtube/v3/subscriptions';

export async function fetchSubscriptions(token: string): Promise<string[]> {
    const params = new URLSearchParams({
        part: 'snippet',
        mine: 'true',
        maxResults: '50'
    });

    const response = await fetch(`${SUBSCRIPTIONS_ENDPOINT}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`YouTube API error (${response.status}): ${text}`);
    }

    const data: SubscriptionsResponse = await response.json();
    return data.items.map((item) => item.snippet.title);
}
```

- [ ] **Step 2: Run check**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/YtHelper/api.ts
git commit -m "feat(yt-helper): implement YouTube subscriptions API call"
```

---

### Task 7: Implement the page component

**Files:**

- Modify: `src/routes/(yt-helper)/yt-helper/+page.svelte`

- [ ] **Step 1: Replace `+page.svelte` content**

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import { startOAuthFlow, exchangeCodeForToken, clearAuth } from '$lib/YtHelper/auth';
    import { fetchSubscriptions } from '$lib/YtHelper/api';
    import { authStore } from '$lib/YtHelper/store';

    onMount(async () => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (!code) return;

        // Clean the code from the URL immediately
        const cleanUrl = window.location.pathname;
        history.replaceState(null, '', cleanUrl);

        const verifier = sessionStorage.getItem('yt_pkce_verifier');
        if (!verifier) {
            authStore.update((s) => ({
                ...s,
                status: 'unauthenticated',
                error: 'OAuth flow interrupted — please try again.'
            }));
            return;
        }

        authStore.update((s) => ({ ...s, status: 'loading' }));
        try {
            const token = await exchangeCodeForToken(code);
            const subscriptions = await fetchSubscriptions(token);
            authStore.set({ status: 'authenticated', token, subscriptions, error: null });
        } catch (e) {
            authStore.set({
                status: 'unauthenticated',
                token: null,
                subscriptions: [],
                error: e instanceof Error ? e.message : 'An unknown error occurred'
            });
        }
    });
</script>

<main>
    <h1>YouTube Helper</h1>

    {#if $authStore.status === 'unauthenticated'}
        {#if $authStore.error}
            <p class="error">{$authStore.error}</p>
        {/if}
        <button onclick={startOAuthFlow}>Connect to YouTube</button>
    {:else if $authStore.status === 'loading'}
        <p>Loading...</p>
    {:else if $authStore.status === 'authenticated'}
        <button onclick={clearAuth}>Disconnect</button>
        <h2>Subscriptions ({$authStore.subscriptions.length})</h2>
        <ul>
            {#each $authStore.subscriptions as name}
                <li>{name}</li>
            {/each}
        </ul>
    {/if}
</main>

<style>
    main {
        max-width: 600px;
        margin: 2rem auto;
        padding: 0 1rem;
    }

    .error {
        color: var(--color-error, red);
    }
</style>
```

- [ ] **Step 2: Run check**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/\(yt-helper\)/yt-helper/+page.svelte
git commit -m "feat(yt-helper): implement OAuth PKCE page"
```

---

### Task 8: Manual integration test

> Before this task, you must have a real `PUBLIC_YOUTUBE_CLIENT_ID` set in `env.local` and the redirect URI `https://localhost:5173/yt-helper` registered in Google Cloud Console.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Visit `https://localhost:5173/yt-helper`**

Expected: "Connect to YouTube" button is visible.

- [ ] **Step 3: Click "Connect to YouTube"**

Expected: Redirected to Google's consent screen with the correct app name and `youtube.readonly` scope shown.

- [ ] **Step 4: Approve the consent screen**

Expected: Redirected back to `https://localhost:5173/yt-helper`. URL has no `?code=` param (cleaned by `replaceState`). Subscription list appears with channel names.

- [ ] **Step 5: Click "Disconnect"**

Expected: Page returns to the "Connect to YouTube" button state.

- [ ] **Step 6: Simulate interrupted flow — refresh mid-redirect**

Open `/yt-helper?code=fake_code` manually in the browser (no verifier in sessionStorage).
Expected: Error message "OAuth flow interrupted — please try again." and the unauthenticated state is shown.
