// OAuth flow step 4: called by the frontend when the user disconnects.
// Pipeline: setPassportHeaders → doPassportSession → clearGoogleSession → apiPipeline.
// clearGoogleSession deletes req.session.googleAccessToken and saves the session
// before calling next(), so subsequent requests are treated as unauthenticated.
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
