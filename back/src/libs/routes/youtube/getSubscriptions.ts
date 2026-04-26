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
