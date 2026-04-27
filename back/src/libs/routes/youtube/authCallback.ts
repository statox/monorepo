// OAuth flow step 2: Google redirects the browser here after the user grants consent.
// Pipeline: setPassportHeaders → doPassportSession → doGoogleOAuthCallback → storeGoogleTokenAndRedirect.
// doGoogleOAuthCallback exchanges the authorization code for an access token (no
// UserInfo fetch — skipUserProfile:true in the strategy). On success it sets
// req.user = { accessToken } and calls next(); storeGoogleTokenAndRedirect then
// saves the token to req.session.googleAccessToken and redirects to the frontend.
// This handler never runs — both middleware end the request before apiPipeline.
import { EmptyInput, EmptyOutput, GetRoute } from '../types.js';
import { emptyObjectSchema } from '../helpers.js';

export const route: GetRoute<EmptyInput, EmptyOutput> = {
    method: 'get',
    path: '/youtube/auth/callback',
    authentication: 'google',
    outputSchema: emptyObjectSchema,
    handler: async () => {}
};
