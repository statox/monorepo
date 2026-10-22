import { FromSchema } from 'json-schema-to-ts';
import { EmptyOutput, PostRoute, RouteHandler } from '../types.js';
import { confirmEntryUpload } from '../../modules/clipboard/index.js';
import { emptyObjectSchema } from '../helpers.js';

const handler: RouteHandler<Input> = async (params) => {
    const { linkId } = params.input;
    params.loggableContext.addData('linkId', linkId);
    await confirmEntryUpload(linkId);
};

const inputSchema = {
    type: 'object',
    required: ['linkId'],
    additionalProperties: false,
    properties: {
        linkId: { type: 'string', minLength: 1 }
    }
} as const;

type Input = FromSchema<typeof inputSchema>;

export const route: PostRoute<Input, EmptyOutput> = {
    method: 'post',
    path: '/clipboard/confirmUpload',
    inputSchema,
    handler,
    authentication: 'user2',
    scope: 'admin',
    clientErrors: ['ITEM_NOT_FOUND', 'UPLOAD_NOT_FOUND'],
    outputSchema: emptyObjectSchema
};
