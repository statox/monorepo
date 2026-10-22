import { FromSchema } from 'json-schema-to-ts';
import { PostRoute, RouteHandler } from '../types.js';
import { CLIPBOARD_MAX_SIZE_BYTES, prepareEntryUpload } from '../../modules/clipboard/index.js';

const handler: RouteHandler<Input> = (params) => {
    params.loggableContext.addData('entryName', params.input.name);
    return prepareEntryUpload(params.input);
};

const inputSchema = {
    type: 'object',
    required: ['name', 'mimetype', 'sizeBytes'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1 },
        mimetype: { type: 'string', minLength: 1 },
        sizeBytes: { type: 'integer', minimum: 1, maximum: CLIPBOARD_MAX_SIZE_BYTES },
        content: { type: 'string' },
        ttlSeconds: { type: 'number', minimum: 0 },
        isPublic: { type: 'boolean' }
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
    path: '/clipboard/prepareUpload',
    inputSchema,
    handler,
    authentication: 'user2',
    scope: 'admin',
    clientErrors: ['ITEM_ALREADY_EXISTS'],
    outputSchema
};
