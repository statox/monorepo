# YtHelper Frontend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the in-browser PKCE OAuth flow with the backend-managed Google OAuth session flow in the YtHelper SvelteKit pages.

**Architecture:** The site uses the static adapter with `prerender = true` (GitHub Pages deployment) — this must not change. All auth logic runs client-side in `onMount`, identical to how `user2` auth works in the `(apps)` pages: the prerendered HTML shows a loading state, then `onMount` calls the backend to check session status and fills in the real state. The backend owns the OAuth redirect, token storage, and session; the frontend only calls `authStatus`, `subscriptions`, and `authLogout`.

**Tech Stack:** SvelteKit (static adapter), Svelte 5, TypeScript, `client2` (statox API SDK at `$vendor/statox-api`)

---

## File Map

| Action  | File                                            | Purpose                                                                                |
| ------- | ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| Modify  | `src/lib/YtHelper/types.ts`                     | Remove PKCE types; remove `token` from `AuthState`; update `subscriptions` to SDK type |
| Modify  | `src/lib/YtHelper/store.ts`                     | Update initial state to match simplified `AuthState`                                   |
| Rewrite | `src/lib/YtHelper/api.ts`                       | Call `client2.youtube.subscriptions()` — no token arg, no direct YouTube API           |
| Create  | `src/lib/YtHelper/googleAuth.ts`                | `startGoogleOAuthFlow` (browser redirect) and `logoutGoogle` (API call + store reset)  |
| Delete  | `src/lib/YtHelper/auth.ts`                      | Replaced entirely by `googleAuth.ts`                                                   |
| Rewrite | `src/routes/(yt-helper)/yt-helper/+page.svelte` | `onMount`: check `?error`, call `authStatus`, fetch subscriptions if authenticated     |

---

### Task 1: Update data layer (types, store, api)

**Files:**

- Modify: `src/lib/YtHelper/types.ts`
- Modify: `src/lib/YtHelper/store.ts`
- Rewrite: `src/lib/YtHelper/api.ts`

These three files change together. After this task `auth.ts` and `+page.svelte` will have TypeScript errors (imports that no longer exist) — that is expected and will be fixed in Tasks 2 and 3.

- [ ] **Step 1: Replace `types.ts`**

Remove `TokenResponse`, `SubscriptionItem`, and `SubscriptionsResponse` (now owned by the backend/SDK). Remove `token` from `AuthState`. Change `subscriptions` to the SDK type.

```typescript
import type { Youtube_Subscriptions_Output } from '$vendor/statox-api';

export type AuthStatus = 'unauthenticated' | 'loading' | 'authenticated';

export interface AuthState {
    status: AuthStatus;
    subscriptions: Youtube_Subscriptions_Output;
    error: string | null;
}
```

- [ ] **Step 2: Update `store.ts` initial state**

```typescript
import { writable } from 'svelte/store';
import type { AuthState } from './types';

const initialState: AuthState = {
    status: 'unauthenticated',
    subscriptions: [],
    error: null
};

export const authStore = writable<AuthState>(initialState);
```

- [ ] **Step 3: Rewrite `api.ts`**

The `fetchSubscriptions` function no longer takes a token — the session cookie is sent automatically by `client2` (`credentials: 'include'`).

```typescript
import { client2 } from '$lib/api';
import type { Youtube_Subscriptions_Output } from '$vendor/statox-api';

export const fetchSubscriptions = async (): Promise<Youtube_Subscriptions_Output> => {
    return await client2.youtube.subscriptions();
};
```

- [ ] **Step 4: Verify TypeScript (expect errors in auth.ts and +page.svelte only)**

```bash
cd /home/adrien/dev/monorepo/front && npm run check 2>&1 | grep -E "error|Error|✓|✗" | head -20
```

Expected: errors only in `src/lib/YtHelper/auth.ts` and `src/routes/(yt-helper)/yt-helper/+page.svelte` (still reference removed types). Everything else should be clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/YtHelper/types.ts src/lib/YtHelper/store.ts src/lib/YtHelper/api.ts
git commit -m "refactor(yt-helper): simplify data layer - remove PKCE types, use SDK subscription type"
```

---

### Task 2: Replace auth.ts with googleAuth.ts

**Files:**

- Create: `src/lib/YtHelper/googleAuth.ts`
- Delete: `src/lib/YtHelper/auth.ts`

`startGoogleOAuthFlow` navigates the browser directly to the backend's OAuth start URL (not a fetch — a full page navigation is required so the browser follows the redirect chain to Google and back). `logoutGoogle` calls the backend logout endpoint and resets the store.

- [ ] **Step 1: Create `src/lib/YtHelper/googleAuth.ts`**

```typescript
import { getApiUrl } from '$lib/helpers';
import { client2 } from '$lib/api';
import { authStore } from './store';

export const startGoogleOAuthFlow = (): void => {
    window.location.href = `${getApiUrl()}/youtube/auth/start`;
};

export const logoutGoogle = async (): Promise<void> => {
    await client2.youtube.authLogout({});
    authStore.set({ status: 'unauthenticated', subscriptions: [], error: null });
};
```

- [ ] **Step 2: Delete `auth.ts`**

```bash
git rm /home/adrien/dev/monorepo/front/src/lib/YtHelper/auth.ts
```

- [ ] **Step 3: Verify TypeScript (expect errors only in +page.svelte)**

```bash
cd /home/adrien/dev/monorepo/front && npm run check 2>&1 | grep -E "error|Error|✓|✗" | head -20
```

Expected: errors only in `+page.svelte` (still imports from `auth.ts`). `googleAuth.ts` itself should be clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/YtHelper/googleAuth.ts
git commit -m "refactor(yt-helper): replace PKCE auth.ts with googleAuth.ts backed by backend OAuth"
```

---

### Task 3: Rewrite +page.svelte

**Files:**

- Modify: `src/routes/(yt-helper)/yt-helper/+page.svelte`

`onMount` now does three things in order:

1. Check `?error=auth_failed` in the URL (set by the backend's `failureRedirect` when Google denies the OAuth request) — if present, set error state and clean the URL.
2. Call `client2.youtube.authStatus()` to check whether a Google session token exists in the server-side session.
3. If `authenticated: true`, fetch subscriptions and set the store to `authenticated`. If `authenticated: false`, set the store to `unauthenticated`.

The subscription list now renders `{ id, title, description, thumbnailUrl }` objects (was title-only strings).

- [ ] **Step 1: Replace `+page.svelte`**

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import { startGoogleOAuthFlow, logoutGoogle } from '$lib/YtHelper/googleAuth';
    import { fetchSubscriptions } from '$lib/YtHelper/api';
    import { authStore } from '$lib/YtHelper/store';
    import { client2 } from '$lib/api';

    onMount(async () => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('error') === 'auth_failed') {
            history.replaceState(null, '', window.location.pathname);
            authStore.update((s) => ({
                ...s,
                status: 'unauthenticated',
                error: 'Google authentication failed — please try again.'
            }));
            return;
        }

        authStore.update((s) => ({ ...s, status: 'loading' }));
        try {
            const { authenticated } = await client2.youtube.authStatus();
            if (!authenticated) {
                authStore.update((s) => ({ ...s, status: 'unauthenticated' }));
                return;
            }
            const subscriptions = await fetchSubscriptions();
            authStore.set({ status: 'authenticated', subscriptions, error: null });
        } catch (e) {
            authStore.set({
                status: 'unauthenticated',
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
        <button onclick={startGoogleOAuthFlow}>Connect to YouTube</button>
    {:else if $authStore.status === 'loading'}
        <p>Loading...</p>
    {:else if $authStore.status === 'authenticated'}
        <button onclick={logoutGoogle}>Disconnect</button>
        <h2>Subscriptions ({$authStore.subscriptions.length})</h2>
        <ul>
            {#each $authStore.subscriptions as sub (sub.id)}
                <li>
                    {#if sub.thumbnailUrl}
                        <img src={sub.thumbnailUrl} alt={sub.title} width="36" height="36" />
                    {/if}
                    {sub.title}
                </li>
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

    li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    img {
        border-radius: 50%;
    }
</style>
```

- [ ] **Step 2: Verify TypeScript — expect no errors**

```bash
cd /home/adrien/dev/monorepo/front && npm run check 2>&1 | tail -10
```

Expected: clean — no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/routes/(yt-helper)/yt-helper/+page.svelte"
git commit -m "feat(yt-helper): migrate to backend-managed Google OAuth session flow"
```

---

## Self-Review

**Spec coverage:**

- `prerender = true` unchanged → ✓ (`+layout.js` not touched)
- All PKCE code removed → ✓ (`auth.ts` deleted, `googleAuth.ts` has no PKCE)
- `startGoogleOAuthFlow` does full browser navigation to backend → ✓ (Task 2)
- `logoutGoogle` calls backend logout and resets store → ✓ (Task 2)
- `?error=auth_failed` handled on mount → ✓ (Task 3)
- `authStatus` checked on mount before fetching subscriptions → ✓ (Task 3)
- `auth.ts` renamed to `googleAuth.ts` to distinguish from user2 API auth → ✓ (Task 2)
- Subscriptions use SDK type with full objects → ✓ (Tasks 1, 2, 3)
- UI renders thumbnail + title per subscription → ✓ (Task 3)

**No placeholders.**

**Type consistency:**

- `AuthState.subscriptions` is `Youtube_Subscriptions_Output` — defined in Task 1 `types.ts`, matched in Task 1 `store.ts` initial state (`[]`), matched in Task 2 `googleAuth.ts` reset (`[]`), and matched in Task 3 usage (`fetchSubscriptions()` return type).
- `fetchSubscriptions()` takes no arguments — defined in Task 1 `api.ts`, called without args in Task 3 `+page.svelte`.
- `logoutGoogle` resets store with `{ status: 'unauthenticated', subscriptions: [], error: null }` — valid for `AuthState` as defined in Task 1.
- `startGoogleOAuthFlow` and `logoutGoogle` imported from `$lib/YtHelper/googleAuth` in Task 3 — matches exports defined in Task 2.
- `client2.youtube.authStatus()` returns `{ authenticated: boolean }` — matches `Youtube_AuthStatus_Output` in the SDK.
- `client2.youtube.authLogout({})` — `{}` matches `Youtube_AuthLogout_Input` (empty object schema).
