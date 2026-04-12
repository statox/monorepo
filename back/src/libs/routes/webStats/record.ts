import { FromSchema } from 'json-schema-to-ts';
import { EmptyOutput, PostRoute, RouteHandler } from '../types.js';
import { emptyObjectSchema } from '../helpers.js';
import { recordEvent } from '../../modules/webStats/index.js';
import { slog } from '../../modules/logging/index.js';

const inputSchema = {
    type: 'object',
    required: ['clientTimestamp', 'app', 'path', 'action'],
    additionalProperties: false,
    properties: {
        clientTimestamp: { type: 'number' },
        app: { type: 'string' },
        path: { type: 'string' },
        action: { type: 'string' }
    }
} as const;

type Input = FromSchema<typeof inputSchema>;

const handler: RouteHandler<Input> = async (params) => {
    const { clientTimestamp, app, path, action } = params.input;
    slog.log('web-stats', 'Event recorded', { app, path, action });
    await recordEvent({ clientTimestampUnix: clientTimestamp, app, path, action });
};

export const route: PostRoute<Input, EmptyOutput> = {
    method: 'post',
    path: '/web-stats/record',
    inputSchema,
    handler,
    authentication: 'apikey',
    outputSchema: emptyObjectSchema
};
