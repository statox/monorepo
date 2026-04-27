// Google OAuth2 flow (server-side, session-backed)
//
// Step 1 — Start:    GET /youtube/auth/start
//   doGoogleOAuthStart redirects the browser to Google's consent screen.
//   The apiPipeline handler never runs; passport issues the 302 directly.
//
// Step 2 — Callback: GET /youtube/auth/callback?code=...&scope=...
//   Google redirects back here after the user grants consent.
//   doGoogleOAuthCallback exchanges the code for an access token via
//   passport-oauth2 (skipUserProfile: true avoids calling the UserInfo
//   endpoint, which would fail because only youtube.readonly scope was granted).
//   On success req.user = { accessToken }; storeGoogleTokenAndRedirect saves
//   the token in req.session.googleAccessToken and redirects to the frontend.
//
// Step 3 — Authenticated requests (e.g. GET /youtube/subscriptions):
//   validateGoogleSession reads req.session.googleAccessToken and injects it
//   into res.locals so the route handler can use it without touching the session.
//
// Step 4 — Logout: POST /youtube/auth/logout
//   clearGoogleSession deletes req.session.googleAccessToken and saves the session.

import passport from 'passport';
import OAuth2Strategy from 'passport-oauth2';
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
        new OAuth2Strategy(
            {
                authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenURL: 'https://oauth2.googleapis.com/token',
                clientID: config.google.clientId,
                clientSecret: config.google.clientSecret,
                callbackURL: config.google.callbackUrl,
                skipUserProfile: true
            },
            (
                _accessToken: string,
                _refreshToken: string,
                _profile: unknown,
                done: OAuth2Strategy.VerifyCallback
            ) => {
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
export const storeGoogleTokenAndRedirect = (req: Request, res: Response, next: NextFunction) => {
    const { accessToken } = req.user as { accessToken: string };
    req.session.googleAccessToken = accessToken;
    // Explicit save required: saveUninitialized is false, so new data won't persist
    // automatically before the redirect.
    req.session.save((err) => {
        if (err) return next(err);
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
    req.session.save((err) => {
        if (err) return next(err);
        next();
    });
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
