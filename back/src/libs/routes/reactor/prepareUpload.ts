import { FromSchema } from 'json-schema-to-ts';
import { PostRoute, RouteHandler } from '../types.js';
import {
    prepareEntryUpload,
    REACTOR_ALLOWED_MIMES,
    REACTOR_MAX_SIZE_BYTES
} from '../../modules/reactor/index.js';

const handler: RouteHandler<Input> = (params) => {
    params.loggableContext.addData('entryName', params.input.name);
    return prepareEntryUpload(params.input);
};

const inputSchema = {
    type: 'object',
    required: ['name', 'tags', 'mimetype', 'sizeBytes'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1 },
        tags: { type: 'array', items: { type: 'string' } },
        mimetype: { type: 'string', enum: REACTOR_ALLOWED_MIMES },
        sizeBytes: { type: 'integer', minimum: 1, maximum: REACTOR_MAX_SIZE_BYTES }
    }
} as const;

const outputSchema = {
    type: 'object',
    required: ['linkId', 'uploadUrl'],
    additionalProperties: false,
    properties: {
        linkId: { type: 'string' },
        uploadUrl: {
            type: 'string',
            description:
                'Presigned PUT URL. The upload must use the declared Content-Type and size.'
        }
    }
} as const;

type Input = FromSchema<typeof inputSchema>;

export const route: PostRoute<Input, FromSchema<typeof outputSchema>> = {
    method: 'post',
    path: '/reactor/prepareUpload',
    inputSchema,
    handler,
    authentication: 'user2',
    scope: 'admin',
    clientErrors: ['ITEM_ALREADY_EXISTS'],
    outputSchema
};
