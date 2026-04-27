// OAuth flow data request: called by the frontend once authenticated to retrieve
// the user's YouTube subscriptions.
// Pipeline: setPassportHeaders → doPassportSession → validateGoogleSession → apiPipeline.
// validateGoogleSession is a hard check — returns 401 if no token is present in the
// session; otherwise it injects the token into res.locals.googleAccessToken so the
// handler can forward it to the YouTube API.
import { FromSchema } from 'json-schema-to-ts';
import { EmptyInput, GetRoute } from '../types.js';
import { fetchSubscriptions } from '../../modules/youtube/index.js';

const outputSchema = {
    type: 'array',
    items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'description', 'thumbnailUrl'],
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
