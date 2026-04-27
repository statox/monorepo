// OAuth flow step 3 (polling): called by the frontend after the OAuth redirect
// to check whether the callback succeeded and a session token was stored.
// Pipeline: setPassportHeaders → doPassportSession → checkGoogleSession → apiPipeline.
// checkGoogleSession is a soft check — it always calls next() and only populates
// res.locals.googleAccessToken when a token exists in the session.
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
