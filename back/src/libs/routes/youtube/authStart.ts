// OAuth flow step 1: called by the frontend to initiate Google authentication.
// Pipeline: setPassportHeaders → doPassportSession → doGoogleOAuthStart.
// doGoogleOAuthStart (passport.authenticate) issues a 302 to Google's consent
// screen. This handler never runs — passport ends the request before apiPipeline.
import { EmptyInput, EmptyOutput, GetRoute } from '../types.js';
import { emptyObjectSchema } from '../helpers.js';

export const route: GetRoute<EmptyInput, EmptyOutput> = {
    method: 'get',
    path: '/youtube/auth/start',
    authentication: 'google',
    outputSchema: emptyObjectSchema,
    handler: async () => {}
};
