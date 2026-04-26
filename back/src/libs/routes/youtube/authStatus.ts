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
