import { FromSchema } from 'json-schema-to-ts';
import { EmptyOutput, PostRoute, RouteHandler } from '../types.js';
import { addEntry } from '../../modules/clipboard/index.js';
import { emptyObjectSchema } from '../helpers.js';

const handler: RouteHandler<Input> = async (params) => {
    params.loggableContext.addData('entryName', params.input.name);
    await addEntry(params.input);
};

// Entries with a file go through prepareUpload and confirmUpload
const inputSchema = {
    type: 'object',
    required: ['name', 'content'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1 },
        content: { type: 'string', minLength: 1 },
        ttlSeconds: { type: 'number', minimum: 0 },
        isPublic: { type: 'boolean' }
    }
} as const;

type Input = FromSchema<typeof inputSchema>;

export const route: PostRoute<Input, EmptyOutput> = {
    method: 'post',
    path: '/clipboard/addEntry',
    inputSchema,
    handler,
    authentication: 'user2',
    scope: 'admin',
    clientErrors: ['ITEM_ALREADY_EXISTS'],
    outputSchema: emptyObjectSchema
};
