# YouTube Google Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `google` authentication type to the route system backed by `passport-google-oauth20`, so the frontend can let users authenticate with Google and the backend can call the YouTube API on their behalf.

**Architecture:** All five YouTube routes live in the route system under `authentication: 'google'`. In `app.ts`, the `google` branch mirrors the `user2` branch exactly: `doPassportSession` is always pushed, then path-specific middleware is chosen. For `authStart` and `authCallback`, the chosen middleware issues the HTTP 302 itself and never calls `next()` — so `apiPipeline` (and the route handler) never runs; those route definitions are registration metadata only. For `authStatus`, `authLogout`, and `getSubscriptions`, the middleware sets up state and calls `next()`, so `apiPipeline` runs normally and the handler returns JSON.

**Tech Stack:** TypeScript, Express, Passport.js (`passport-google-oauth20`), express-session (already installed)

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/packages/config/sources/google.ts` | Google OAuth env vars |
| Modify | `src/packages/config/services/schema.ts` | Add `google` section to config schema |
| Modify | `src/packages/config/services/parseConfig.ts` | Wire google config |
| Create | `src/libs/middleware/auth_google.middleware.ts` | Strategy setup + all Google auth middleware |
| Modify | `src/libs/routes/types.ts` | Add `'google'` to auth union; add `googleAccessToken?` to `RouteHandler` |
| Modify | `src/libs/middleware/apiPipeline.middleware.ts` | Pass `googleAccessToken` from `res.locals` to handler |
| Modify | `src/app.ts` | `google` branch in pipeline loop (mirrors `user2`) |
| Create | `src/libs/modules/youtube/service.ts` | `fetchSubscriptions(token)` |
| Create | `src/libs/modules/youtube/index.ts` | Clean re-export |
| Create | `src/libs/routes/youtube/authStart.ts` | `GET /youtube/auth/start` |
| Create | `src/libs/routes/youtube/authCallback.ts` | `GET /youtube/auth/callback` |
| Create | `src/libs/routes/youtube/authStatus.ts` | `GET /youtube/auth/status` |
| Create | `src/libs/routes/youtube/authLogout.ts` | `POST /youtube/auth/logout` |
| Create | `src/libs/routes/youtube/getSubscriptions.ts` | `GET /youtube/subscriptions` |
| Modify | `src/libs/routes/index.ts` | Register all five routes |
| Modify | `tests/helpers/app/index.ts` | Add `authentication: 'google'` test route |
| Modify | `tests/framework/auth.test.ts` | Test 401 for unauthenticated google route |

---

### Task 1: Install `passport-google-oauth20`

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the package and its types**

```bash
cd /home/adrien/dev/monorepo/back && npm install passport-google-oauth20 && npm install --save-dev @types/passport-google-oauth20
```

Expected: both packages appear in `package.json`.

- [ ] **Step 2: Verify TypeScript can see the types**

```bash
cd /home/adrien/dev/monorepo/back && npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install passport-google-oauth20"
```

---

### Task 2: Add Google config

**Files:**
- Create: `src/packages/config/sources/google.ts`
- Modify: `src/packages/config/services/schema.ts`
- Modify: `src/packages/config/services/parseConfig.ts`

- [ ] **Step 1: Create `src/packages/config/sources/google.ts`**

```typescript
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
```

- [ ] **Step 2: Add `google` to `src/packages/config/services/schema.ts`**

Add `'google'` to the `required` array:

```typescript
required: [
    'mysql', 'elk', 'env', 'express', 'ntfy_sh',
    'meteofrance', 'r2', 'slack', 'timeouts', 'google'
],
```

Add the `google` property at the end of the `properties` object:

```typescript
google: {
    description: 'Google OAuth2 credentials for YouTube API access',
    type: 'object',
    additionalProperties: false,
    required: ['clientId', 'clientSecret', 'callbackUrl', 'frontendRedirectUrl'],
    properties: {
        clientId: { description: 'Google OAuth2 client ID', type: 'string', minLength: 2 },
        clientSecret: { description: 'Google OAuth2 client secret', type: 'string', minLength: 2 },
        callbackUrl: {
            description: 'OAuth2 callback URL registered in Google Cloud Console',
            type: 'string',
            pattern: '^https?://.+'
        },
        frontendRedirectUrl: {
            description: 'Frontend URL to redirect to after successful OAuth',
            type: 'string',
            pattern: '^https?://.+'
        }
    }
}
```

- [ ] **Step 3: Wire config in `src/packages/config/services/parseConfig.ts`**

Add the import after existing imports:

```typescript
import {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL,
    GOOGLE_FRONTEND_REDIRECT_URL
} from '../sources/google.js';
```

Add the `google` field to the `config` object after `timeouts`:

```typescript
google: {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackUrl: GOOGLE_CALLBACK_URL,
    frontendRedirectUrl: GOOGLE_FRONTEND_REDIRECT_URL
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /home/adrien/dev/monorepo/back && npx tsc --noEmit
```

Expected: `config.google.clientId` etc. are typed correctly.

- [ ] **Step 5: Run framework tests**

```bash
cd /home/adrien/dev/monorepo/back && npm run tests:framework
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/packages/config/
git commit -m "feat: add Google OAuth config"
```

---

### Task 3: Create `auth_google.middleware.ts`

**Files:**
- Create: `src/libs/middleware/auth_google.middleware.ts`

There are five exported middleware functions, each used in a specific path slot of the `google` pipeline branch (see Task 5):

| Middleware | Used for path | Calls `next()`? |
|---|---|---|
| `doGoogleOAuthStart` | `/youtube/auth/start` | No — Passport issues 302, request ends |
| `doGoogleOAuthCallback` | `/youtube/auth/callback` | Only on failure (redirects); on success calls `next()` |
| `storeGoogleTokenAndRedirect` | `/youtube/auth/callback` | No — issues 302, request ends |
| `checkGoogleSession` | `/youtube/auth/status` | Always — sets `res.locals.googleAccessToken` if present |
| `clearGoogleSession` | `/youtube/auth/logout` | Always — clears token, then handler returns `{}` |
| `validateGoogleSession` | all other `google` routes | `next()` if token present, 401 otherwise |

- [ ] **Step 1: Create the file**

```typescript
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { NextFunction, Request, Response } from 'express';
import { config } from '../../packages/config/index.js';
import { Auth_UnauthorizedError } from '../modules/auth/index.js';

// Augment express-session so req.session.googleAccessToken is typed
declare module 'express-session' {
    interface SessionData {
        googleAccessToken?: string;
    }
}

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

// Redirects the browser to Google's consent screen. Does NOT call next() — Passport
// issues the 302 itself, ending the request before apiPipeline runs.
export const doGoogleOAuthStart = passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/youtube.readonly']
});

// Validates the OAuth callback (state check + code exchange).
// session: false is critical — prevents Passport from calling serializeUser, which
// would overwrite req.session.passport.user set by the existing local auth strategy.
// On failure redirects to frontend; on success sets req.user = { accessToken } and
// calls next() so storeGoogleTokenAndRedirect can run.
export const doGoogleOAuthCallback = passport.authenticate('google', {
    session: false,
    failureRedirect: `${config.google.frontendRedirectUrl}?error=auth_failed`
});

// Stores the access token in our own session key and redirects to the frontend.
// Does NOT call next() — issues the 302, ending the request before apiPipeline runs.
export const storeGoogleTokenAndRedirect = (req: Request, res: Response) => {
    const { accessToken } = req.user as { accessToken: string };
    req.session.googleAccessToken = accessToken;
    // Explicit save required: saveUninitialized is false, so new data won't persist
    // automatically before the redirect.
    req.session.save(() => {
        res.redirect(config.google.frontendRedirectUrl);
    });
};

// Soft session check for authStatus: always calls next(), sets res.locals.googleAccessToken
// when a token is present. The handler decides what { authenticated: bool } to return.
export const checkGoogleSession = (req: Request, res: Response, next: NextFunction) => {
    res.locals.googleAccessToken = req.session.googleAccessToken;
    next();
};

// Clears the token from session, then calls next() so apiPipeline runs and the
// handler returns {}.
export const clearGoogleSession = (req: Request, res: Response, next: NextFunction) => {
    delete req.session.googleAccessToken;
    req.session.save(() => next());
};

// Hard session check for data routes: passes Auth_UnauthorizedError to the error
// middleware (which returns 401 { message: 'UNAUTHORIZED' }) if no token is present.
export const validateGoogleSession = (req: Request, res: Response, next: NextFunction) => {
    const token = req.session.googleAccessToken;
    if (!token) {
        return next(new Auth_UnauthorizedError());
    }
    res.locals.googleAccessToken = token;
    next();
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/adrien/dev/monorepo/back && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/libs/middleware/auth_google.middleware.ts
git commit -m "feat: add Google OAuth middleware"
```

---

### Task 4: Extend route types + update `apiPipeline`

**Files:**
- Modify: `src/libs/routes/types.ts`
- Modify: `src/libs/middleware/apiPipeline.middleware.ts`

- [ ] **Step 1: Add `'google'` to authentication union in `src/libs/routes/types.ts`**

In `BaseRouteNotUser2`, change:

```typescript
authentication: 'none' | 'user' | 'apikey-iot' | 'apikey';
```

to:

```typescript
authentication: 'none' | 'user' | 'apikey-iot' | 'apikey' | 'google';
```

Add `googleAccessToken?: string` to `RouteHandler`:

```typescript
export type RouteHandler<Input> = (params: {
    input: Input;
    loggableContext: LoggableContext;
    authenticatedUser?: User;
    googleAccessToken?: string;
}) => Promise<unknown>;
```

- [ ] **Step 2: Pass `googleAccessToken` from `res.locals` in `apiPipeline.middleware.ts`**

Change the handler call from:

```typescript
routeResult =
    (await route.handler({
        input,
        loggableContext: res.locals.loggableContext,
        authenticatedUser: req.user as User
    })) || {};
```

to:

```typescript
routeResult =
    (await route.handler({
        input,
        loggableContext: res.locals.loggableContext,
        authenticatedUser: req.user as User,
        googleAccessToken: res.locals.googleAccessToken as string | undefined
    })) || {};
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /home/adrien/dev/monorepo/back && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/libs/routes/types.ts src/libs/middleware/apiPipeline.middleware.ts
git commit -m "feat: add google auth type and googleAccessToken handler param"
```

---

### Task 5: Wire `authentication: 'google'` into `app.ts`

**Files:**
- Modify: `src/app.ts`

The `google` branch in the pipeline loop mirrors the `user2` branch: `doPassportSession` is always first, then a path-based condition selects the right middleware. For `authStart` and `authCallback`, the chosen middleware issues the HTTP 302 and never calls `next()`, so `apiPipeline` (added at the end of every pipeline) never runs for those paths.

- [ ] **Step 1: Add imports**

Add alongside the existing auth middleware imports:

```typescript
import {
    setupGoogleStrategy,
    doGoogleOAuthStart,
    doGoogleOAuthCallback,
    storeGoogleTokenAndRedirect,
    checkGoogleSession,
    clearGoogleSession,
    validateGoogleSession
} from './libs/middleware/auth_google.middleware.js';
```

- [ ] **Step 2: Call `setupGoogleStrategy()` inside `initApp()`**

Add it just before the `for (const route of routes.list)` loop:

```typescript
setupGoogleStrategy();
```

- [ ] **Step 3: Add the `google` branch to the pipeline loop**

Inside the `for (const route of routes.list)` loop, add the `google` branch after the existing `apikey` branch and before `user2`:

```typescript
} else if (route.authentication === 'google') {
    pipeline.push(doPassportSession);
    if (route.path === '/youtube/auth/start') {
        // Passport issues the 302 to Google; apiPipeline never runs
        pipeline.push(doGoogleOAuthStart);
    } else if (route.path === '/youtube/auth/callback') {
        // On success: sets req.user = { accessToken }, calls next()
        // On failure: redirects to frontend with ?error=auth_failed
        pipeline.push(doGoogleOAuthCallback);
        // Issues 302 to frontend; apiPipeline never runs
        pipeline.push(storeGoogleTokenAndRedirect);
    } else if (route.path === '/youtube/auth/status') {
        // Soft check: always calls next(), handler reads googleAccessToken from params
        pipeline.push(checkGoogleSession);
    } else if (route.path === '/youtube/auth/logout') {
        // Clears token from session, calls next() so handler can return {}
        pipeline.push(clearGoogleSession);
    } else {
        // All other google-authenticated routes require a valid token
        pipeline.push(validateGoogleSession);
    }
}
```

The full `if/else if` block in the loop now reads:

```typescript
if (route.authentication === 'apikey-iot') {
    pipeline.push(validateAPIKeyHeader);
} else if (route.authentication === 'apikey') {
    pipeline.push(validateAPIKey);
} else if (route.authentication === 'google') {
    pipeline.push(doPassportSession);
    if (route.path === '/youtube/auth/start') {
        pipeline.push(doGoogleOAuthStart);
    } else if (route.path === '/youtube/auth/callback') {
        pipeline.push(doGoogleOAuthCallback);
        pipeline.push(storeGoogleTokenAndRedirect);
    } else if (route.path === '/youtube/auth/status') {
        pipeline.push(checkGoogleSession);
    } else if (route.path === '/youtube/auth/logout') {
        pipeline.push(clearGoogleSession);
    } else {
        pipeline.push(validateGoogleSession);
    }
} else if (route.authentication === 'user2') {
    pipeline.push(setPassportHeaders);
    pipeline.push(doPassportSession);
    if (route.path === '/auth/login') {
        pipeline.push(validatePassportAuth);
    } else if (route.path === '/auth/logout') {
        pipeline.push(logoutPassportRequest);
    } else {
        pipeline.push(validatePassportSession);
        pipeline.push(validateEndpointScope(route.scope));
    }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /home/adrien/dev/monorepo/back && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app.ts
git commit -m "feat: wire google auth pipeline into app.ts"
```

---

### Task 6: YouTube service module and route files

**Files:**
- Create: `src/libs/modules/youtube/service.ts`
- Create: `src/libs/modules/youtube/index.ts`
- Create: `src/libs/routes/youtube/authStart.ts`
- Create: `src/libs/routes/youtube/authCallback.ts`
- Create: `src/libs/routes/youtube/authStatus.ts`
- Create: `src/libs/routes/youtube/authLogout.ts`
- Create: `src/libs/routes/youtube/getSubscriptions.ts`
- Modify: `src/libs/routes/index.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/routes/youtube/getSubscriptions.test.ts`:

```typescript
import request from 'supertest';
import { app } from '../../../src/app.js';
import { assert } from 'chai';

describe('youtube/getSubscriptions', () => {
    it('should return 401 when not authenticated with Google', async () => {
        await request(app)
            .get('/youtube/subscriptions')
            .expect(401)
            .then((response) => {
                assert.equal(response.body.message, 'UNAUTHORIZED');
            });
    });
});
```

Create `tests/routes/youtube/authStatus.test.ts`:

```typescript
import request from 'supertest';
import { app } from '../../../src/app.js';
import { assert } from 'chai';

describe('youtube/authStatus', () => {
    it('should return authenticated: false when no Google session exists', async () => {
        await request(app)
            .get('/youtube/auth/status')
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, { authenticated: false });
            });
    });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/adrien/dev/monorepo/back && npm run tests -- -f 'youtube/'
```

Expected: FAIL — routes don't exist yet (404).

- [ ] **Step 3: Create `src/libs/modules/youtube/service.ts`**

```typescript
type Subscription = {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string | null;
};

type YouTubeApiResponse = {
    items: Array<{
        id: string;
        snippet: {
            title: string;
            description: string;
            thumbnails?: { default?: { url: string } };
        };
    }>;
};

export const fetchSubscriptions = async (accessToken: string): Promise<Subscription[]> => {
    const url =
        'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50&order=alphabetical';

    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as YouTubeApiResponse;

    return data.items.map((item) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails?.default?.url ?? null
    }));
};
```

- [ ] **Step 4: Create `src/libs/modules/youtube/index.ts`**

```typescript
export { fetchSubscriptions } from './service.js';
```

- [ ] **Step 5: Create `src/libs/routes/youtube/authStart.ts`**

The handler is never called — `doGoogleOAuthStart` issues the 302 before `apiPipeline` runs.

```typescript
import { EmptyInput, EmptyOutput, GetRoute } from '../types.js';
import { emptyObjectSchema } from '../helpers.js';

export const route: GetRoute<EmptyInput, EmptyOutput> = {
    method: 'get',
    path: '/youtube/auth/start',
    authentication: 'google',
    outputSchema: emptyObjectSchema,
    handler: async () => {}
};
```

- [ ] **Step 6: Create `src/libs/routes/youtube/authCallback.ts`**

The handler is never called — `storeGoogleTokenAndRedirect` issues the 302 before `apiPipeline` runs.

```typescript
import { EmptyInput, EmptyOutput, GetRoute } from '../types.js';
import { emptyObjectSchema } from '../helpers.js';

export const route: GetRoute<EmptyInput, EmptyOutput> = {
    method: 'get',
    path: '/youtube/auth/callback',
    authentication: 'google',
    outputSchema: emptyObjectSchema,
    handler: async () => {}
};
```

- [ ] **Step 7: Create `src/libs/routes/youtube/authStatus.ts`**

`checkGoogleSession` runs before `apiPipeline`, setting `res.locals.googleAccessToken` if the session has a token (or leaving it `undefined`). The handler reads it via `googleAccessToken`.

```typescript
import { FromSchema } from 'json-schema-to-ts';
import { EmptyInput, GetRoute } from '../types.js';

const outputSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['authenticated'],
    properties: {
        authenticated: { type: 'boolean' }
    }
} as const;

type Output = FromSchema<typeof outputSchema>;

export const route: GetRoute<EmptyInput, Output> = {
    method: 'get',
    path: '/youtube/auth/status',
    authentication: 'google',
    outputSchema,
    handler: async ({ googleAccessToken }) => {
        return { authenticated: googleAccessToken !== undefined };
    }
};
```

- [ ] **Step 8: Create `src/libs/routes/youtube/authLogout.ts`**

`clearGoogleSession` deletes the token and calls `next()`. The handler just returns `{}`.

```typescript
import { EmptyInput, EmptyOutput, PostRoute } from '../types.js';
import { emptyObjectSchema } from '../helpers.js';

export const route: PostRoute<EmptyInput, EmptyOutput> = {
    method: 'post',
    path: '/youtube/auth/logout',
    authentication: 'google',
    inputSchema: emptyObjectSchema,
    outputSchema: emptyObjectSchema,
    handler: async () => ({})
};
```

- [ ] **Step 9: Create `src/libs/routes/youtube/getSubscriptions.ts`**

`validateGoogleSession` runs before `apiPipeline` and 401s if no token. The `!` assertion on `googleAccessToken` is safe because the middleware guarantees it is present.

```typescript
import { FromSchema } from 'json-schema-to-ts';
import { EmptyInput, GetRoute } from '../types.js';
import { fetchSubscriptions } from '../../modules/youtube/index.js';

const outputSchema = {
    type: 'array',
    items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'description'],
        properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            thumbnailUrl: { type: ['string', 'null'] }
        }
    }
} as const;

type Output = FromSchema<typeof outputSchema>;

export const route: GetRoute<EmptyInput, Output> = {
    method: 'get',
    path: '/youtube/subscriptions',
    authentication: 'google',
    outputSchema,
    handler: async ({ googleAccessToken }) => fetchSubscriptions(googleAccessToken!)
};
```

- [ ] **Step 10: Register all five routes in `src/libs/routes/index.ts`**

Add imports near the top:

```typescript
import { route as Youtube_authStart } from './youtube/authStart.js';
import { route as Youtube_authCallback } from './youtube/authCallback.js';
import { route as Youtube_authStatus } from './youtube/authStatus.js';
import { route as Youtube_authLogout } from './youtube/authLogout.js';
import { route as Youtube_getSubscriptions } from './youtube/getSubscriptions.js';
```

Add to `routes.list`:

```typescript
Youtube_authStart,
Youtube_authCallback,
Youtube_authStatus,
Youtube_authLogout,
Youtube_getSubscriptions,
```

- [ ] **Step 11: Run the failing tests — should now pass**

```bash
cd /home/adrien/dev/monorepo/back && npm run tests -- -f 'youtube/'
```

Expected: both tests pass (`authStatus` returns 200 `{ authenticated: false }`, `getSubscriptions` returns 401).

- [ ] **Step 12: Verify TypeScript compiles**

```bash
cd /home/adrien/dev/monorepo/back && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 13: Generate the SDK**

```bash
cd /home/adrien/dev/monorepo/back && npm run generate:sdk
```

- [ ] **Step 14: Run all tests + lint**

```bash
cd /home/adrien/dev/monorepo/back && npm run tests:all && npm run check
```

Expected: all pass, no lint errors.

- [ ] **Step 15: Commit**

```bash
git add src/libs/modules/youtube/ src/libs/routes/youtube/ src/libs/routes/index.ts tests/routes/youtube/
git commit -m "feat: add YouTube routes with google auth"
```

---

### Task 7: Framework test for `authentication: 'google'`

**Files:**
- Modify: `tests/helpers/app/index.ts`
- Modify: `tests/framework/auth.test.ts`

- [ ] **Step 1: Write the failing framework test in `tests/framework/auth.test.ts`**

Add at the end of the file:

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

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/adrien/dev/monorepo/back && npm run tests:framework -- -f 'google auth'
```

Expected: FAIL — route `/googleauthenticatedgetroute` doesn't exist yet.

- [ ] **Step 3: Add the test route to `tests/helpers/app/index.ts`**

Add a `google`-authenticated test route after the existing test route definitions:

```typescript
const googleAuthenticatedGetRoute: GetRoute<EmptyInput, EmptyOutput> = {
    method: 'get',
    authentication: 'google',
    path: '/googleauthenticatedgetroute',
    handler: async () => {},
    outputSchema: emptyObjectSchema
};
```

Add it to the `testRoutes` array:

```typescript
const testRoutes = [
    ...routesAuth.list,
    apiiotAuthenticatedGetRoute,
    googleAuthenticatedGetRoute,   // <-- add here
    getRoute,
    getRouteThatThrows,
    getRouteWithCustomOutputHandler,
    getRouteWithInvalidOutput,
    getRouteWithLoggedContext,
    getRouteWithResult,
    postRoute,
    postRouteInvalidNoScope,
    postRouteScopeAdmin,
    postRouteScopePublic,
    userAuthenticatedGetRoute
];
```

- [ ] **Step 4: Run framework test — should pass**

```bash
cd /home/adrien/dev/monorepo/back && npm run tests:framework -- -f 'google auth'
```

Expected: PASS.

- [ ] **Step 5: Run full framework suite + lint**

```bash
cd /home/adrien/dev/monorepo/back && npm run tests:framework && npm run check
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add tests/helpers/app/index.ts tests/framework/auth.test.ts
git commit -m "test: add framework test for google auth type"
```

---

## Self-Review

**Spec coverage:**
- `authentication: 'google'` type wired into route system → Tasks 4 + 5 ✓
- `passport-google-oauth20` strategy → Task 3 ✓
- `authStart` redirects to Google → Tasks 3 + 5 + 6 ✓
- `authCallback` exchanges code, stores token in session, redirects to frontend → Tasks 3 + 5 + 6 ✓
- `authStatus` returns `{ authenticated: boolean }` (never 401s) → Tasks 3 + 5 + 6 ✓
- `authLogout` clears session token → Tasks 3 + 5 + 6 ✓
- `getSubscriptions` handler receives `googleAccessToken`, 401 when absent → Tasks 4 + 6 ✓
- Config: `clientId`, `clientSecret`, `callbackUrl`, `frontendRedirectUrl` → Task 2 ✓
- Tests → Tasks 6 + 7 ✓

**No placeholders.**

**Type consistency:**
- `validateGoogleSession` / `checkGoogleSession` set `res.locals.googleAccessToken: string | undefined`
- `apiPipeline` reads `res.locals.googleAccessToken as string | undefined` → `googleAccessToken?` in handler — consistent
- `storeGoogleTokenAndRedirect` casts `req.user as { accessToken: string }` — safe because `doGoogleOAuthCallback` runs before it and sets `req.user` via `done(null, { accessToken })` in the strategy verify callback
- `route.authentication === 'google'` in `app.ts` — valid because Task 4 added `'google'` to the union
- `clearGoogleSession` deletes `req.session.googleAccessToken` — typed via `declare module 'express-session'` augmentation in Task 3

**`authStart` / `authCallback` handler never called:** `doGoogleOAuthStart` and `storeGoogleTokenAndRedirect` issue HTTP 302 without calling `next()`. Express stops processing the pipeline at that point. `apiPipeline` (always last in the array) is never reached. The route handler `async () => {}` is registration metadata only — this is the same pattern as `user2` routes whose handler never runs if the preceding auth middleware rejects the request.

**Session isolation:** `session: false` on `doGoogleOAuthCallback` is critical. It prevents Passport from calling `serializeUser` with the Google "user" object, which would overwrite `req.session.passport.user` set by the local auth strategy. The two auth mechanisms store data in separate session keys: `req.session.passport.user` (local) and `req.session.googleAccessToken` (Google).
