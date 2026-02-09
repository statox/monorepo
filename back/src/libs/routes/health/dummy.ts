import { FromSchema } from 'json-schema-to-ts';
import { EmptyInput, GetRoute } from '../types.js';
import { config } from '../../../packages/config/index.js';

/*
 * This is a temporary endpoint to test dotenvx.
 * TO BE REMOVED
 */

const handler = async () => {
    return `Dummy env variable: "${config.dummy}"`;
};

const outputSchema = {
    type: 'string'
} as const;

export const route: GetRoute<EmptyInput, FromSchema<typeof outputSchema>> = {
    method: 'get',
    path: '/health/dummy',
    handler,
    authentication: 'none',
    outputSchema
};
