# Replace passport-google-oauth20 with passport-oauth2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `passport-google-oauth20` (which unconditionally fetches the Google UserInfo profile, breaking when only `youtube.readonly` scope is granted) with `passport-oauth2` configured with `skipUserProfile: true` so the OAuth code-exchange completes without hitting the UserInfo endpoint.

**Architecture:** `passport-oauth2` is the base OAuth2 strategy that `passport-google-oauth20` extends. By using it directly with Google's `authorizationURL` and `tokenURL` and setting `skipUserProfile: true`, the verify callback is called immediately after the token exchange — no profile fetch, no UserInfo endpoint call. The rest of the middleware chain (`storeGoogleTokenAndRedirect`, `validateGoogleSession`, etc.) is unchanged.

**Tech Stack:** passport, passport-oauth2 (already a transitive dep in node_modules), Express, TypeScript

---

## Files Changed

- Modify: `back/src/libs/middleware/auth_google.middleware.ts` — swap strategy import and constructor
- Modify: `back/package.json` — promote `passport-oauth2` to a direct dependency, add `@types/passport-oauth2` devDependency, remove `passport-google-oauth20` and its types
- Modify: `back/tests/framework/auth.test.ts` — add test verifying `/youtube/auth/start` redirects to Google with the correct scope

---

### Task 1: Add failing test for OAuth start redirect

This test documents the expected behaviour and will pass after the fix (the strategy itself is re-registered in `setupGoogleStrategy`, which is called by `initApp` which runs in `beforeAll` of the framework test suite).

**Files:**
- Modify: `back/tests/framework/auth.test.ts`

- [ ] **Step 1: Add the test inside the existing `google auth` describe block**

Open `back/tests/framework/auth.test.ts`. The `google auth` block currently reads:

```typescript
describe('google auth', () => {
    it('should return 401 when no Google session token is present', async () => {
        await request(app)
            .get('/googleauthenticatedgetroute')
            .expect(401)
            .then((response) => {
                assert.equal(response.body.message, 'UNAUTHORIZED');
            });
    });
});
```

Replace it with:

```typescript
describe('google auth', () => {
    it('should return 401 when no Google session token is present', async () => {
        await request(app)
            .get('/googleauthenticatedgetroute')
            .expect(401)
            .then((response) => {
                assert.equal(response.body.message, 'UNAUTHORIZED');
            });
    });

    it('should redirect to Google OAuth with youtube.readonly scope on auth start', async () => {
        const response = await request(app)
            .get('/youtube/auth/start')
            .expect(302);

        const location = response.headers['location'] as string;
        assert.ok(location, 'Expected a Location header');
        assert.ok(
            location.startsWith('https://accounts.google.com/o/oauth2/v2/auth'),
            `Expected redirect to Google auth URL, got: ${location}`
        );
        assert.ok(
            location.includes('youtube.readonly'),
            `Expected youtube.readonly scope in redirect URL, got: ${location}`
        );
        assert.ok(
            !location.includes('profile') && !location.includes('openid') && !location.includes('email'),
            `Expected NO profile/openid/email scope in redirect URL, got: ${location}`
        );
    });
});
```

- [ ] **Step 2: Run the new test to confirm it currently fails**

```bash
cd back && npm run tests:framework -- -f 'should redirect to Google OAuth'
```

Expected: The test fails because `passport-google-oauth20` redirects to `https://accounts.google.com/o/oauth2/auth` (older endpoint), not `https://accounts.google.com/o/oauth2/v2/auth`. This documents the behaviour we are changing.

> Note: if both URLs resolve to the same Google page in practice, the test may pass here. Either way, proceed to Task 2.

- [ ] **Step 3: Commit the test**

```bash
cd back && git add tests/framework/auth.test.ts
git commit -m "test(yt-helper): add failing test for google oauth start redirect URL"
```

---

### Task 2: Promote passport-oauth2 to a direct dependency

`passport-oauth2` is currently only a transitive dependency of `passport-google-oauth20`. We need it to be explicit.

**Files:**
- Modify: `back/package.json`

- [ ] **Step 1: Install passport-oauth2 and its types as direct deps**

```bash
cd back && npm install passport-oauth2 && npm install --save-dev @types/passport-oauth2
```

Expected output: `package.json` gains `"passport-oauth2"` in `dependencies` and `"@types/passport-oauth2"` in `devDependencies`. `package-lock.json` is updated but the package is already in `node_modules` (no new download needed).

- [ ] **Step 2: Verify TypeScript can see the types**

```bash
cd back && npx tsc --noEmit 2>&1 | head -20
```

Expected: No new type errors introduced (there may be pre-existing errors unrelated to this change; those are fine).

- [ ] **Step 3: Commit**

```bash
cd back && git add package.json package-lock.json
git commit -m "chore(yt-helper): add passport-oauth2 as direct dependency"
```

---

### Task 3: Replace GoogleStrategy with OAuth2Strategy

**Files:**
- Modify: `back/src/libs/middleware/auth_google.middleware.ts`

- [ ] **Step 1: Update the import and setupGoogleStrategy function**

Open `back/src/libs/middleware/auth_google.middleware.ts`. The current file starts with:

```typescript
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { NextFunction, Request, Response } from 'express';
import { config } from '../../packages/config/index.js';
import { Auth_UnauthorizedError } from '../modules/auth/index.js';
```

And `setupGoogleStrategy` currently reads:

```typescript
export const setupGoogleStrategy = () => {
    passport.use(
        'google',
        new GoogleStrategy(
            {
                clientID: config.google.clientId,
                clientSecret: config.google.clientSecret,
                callbackURL: config.google.callbackUrl
            },
            (_accessToken, _refreshToken, _profile, done) => {
                // Only the access token matters; no user record is created
                done(null, { accessToken: _accessToken });
            }
        )
    );
};
```

Replace those two sections so the file begins with:

```typescript
import passport from 'passport';
import OAuth2Strategy from 'passport-oauth2';
import { NextFunction, Request, Response } from 'express';
import { config } from '../../packages/config/index.js';
import { Auth_UnauthorizedError } from '../modules/auth/index.js';
```

And `setupGoogleStrategy` becomes:

```typescript
export const setupGoogleStrategy = () => {
    passport.use(
        'google',
        new OAuth2Strategy(
            {
                authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenURL: 'https://oauth2.googleapis.com/token',
                clientID: config.google.clientId,
                clientSecret: config.google.clientSecret,
                callbackURL: config.google.callbackUrl,
                skipUserProfile: true
            },
            (_accessToken, _refreshToken, _profile, done) => {
                // Only the access token matters; no user record is created
                done(null, { accessToken: _accessToken });
            }
        )
    );
};
```

Everything else in the file (`doGoogleOAuthStart`, `doGoogleOAuthCallback`, `storeGoogleTokenAndRedirect`, `checkGoogleSession`, `clearGoogleSession`, `validateGoogleSession`) stays exactly the same.

- [ ] **Step 2: Check TypeScript compiles cleanly**

```bash
cd back && npx tsc --noEmit 2>&1 | grep 'auth_google'
```

Expected: no lines output (no errors in that file).

- [ ] **Step 3: Run the full framework test suite**

```bash
cd back && npm run tests:framework
```

Expected: all tests pass, including the new redirect test added in Task 1.

- [ ] **Step 4: Run the route tests for YouTube**

```bash
cd back && npm run tests -- -f 'youtube'
```

Expected: all youtube tests pass (authStatus returns `{ authenticated: false }`, subscriptions returns 401).

- [ ] **Step 5: Commit**

```bash
cd back && git add src/libs/middleware/auth_google.middleware.ts
git commit -m "fix(yt-helper): replace passport-google-oauth20 with passport-oauth2 to skip UserInfo fetch"
```

---

### Task 4: Remove passport-google-oauth20

`passport-google-oauth20` is no longer used anywhere in the codebase (confirmed by grep: only import was in `auth_google.middleware.ts`). Remove it to avoid confusion.

**Files:**
- Modify: `back/package.json`

- [ ] **Step 1: Uninstall the package and its types**

```bash
cd back && npm uninstall passport-google-oauth20 @types/passport-google-oauth20
```

Expected: both packages removed from `package.json` and `package-lock.json`. Their transitive deps (`passport-oauth2` etc.) remain because we now declare `passport-oauth2` directly.

- [ ] **Step 2: Verify nothing broke**

```bash
cd back && npm run tests:framework && npm run tests -- -f 'youtube'
```

Expected: all tests still pass.

- [ ] **Step 3: Run lint**

```bash
cd back && npm run check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd back && git add package.json package-lock.json
git commit -m "chore(yt-helper): remove passport-google-oauth20 - replaced by passport-oauth2"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Root cause is the forced UserInfo fetch in `passport-google-oauth20`. Fix removes that by using `passport-oauth2` + `skipUserProfile: true`. All OAuth routes (`/auth/start`, `/auth/callback`, `/auth/status`, `/auth/logout`, `/subscriptions`) are unaffected because all other middleware is unchanged.
- [x] **No placeholders:** All code blocks are complete and copy-pasteable.
- [x] **Type consistency:** `OAuth2Strategy` from `passport-oauth2` accepts `{ accessToken: string }` as the serialized user object, matching what `storeGoogleTokenAndRedirect` reads via `req.user as { accessToken: string }`.
- [x] **Arity of verify callback:** `passport-oauth2` dispatches the verify callback based on `arity`. Our callback has 4 parameters `(_accessToken, _refreshToken, _profile, done)` so `arity == 4` → it is called as `_verify(accessToken, refreshToken, profile, done)` where `profile` is `null` (because `skipIt()` calls `done(null)`). This is correct.
