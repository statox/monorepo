import { FromSchema } from 'json-schema-to-ts';
import { EmptyOutput, PostWithFileRoute, RouteWithFileHandler } from '../types.js';
import { addEntry, FileRequiredError } from '../../modules/reactor/index.js';
import { emptyObjectSchema } from '../helpers.js';

const handler: RouteWithFileHandler<Input> = async (params) => {
    const { name, commaSeparatedTags } = params.input;
    params.loggableContext.addData('entryName', name);

    const tags = commaSeparatedTags.split(',').filter((tag: string) => tag.length);
    const file = params.file;

    if (!file) {
        throw new FileRequiredError();
    }

    await addEntry({ name, file, tags });
};

const inputSchema = {
    type: 'object',
    required: ['name', 'commaSeparatedTags'],
    additionalProperties: false,
    properties: {
        name: {
            type: 'string'
        },
        // Sending the file forces us to use a multipart/form-data upload
        // So we can't really have proper JSON with array fields.
        // Instead we get the tags as a big string of comma separated words
        commaSeparatedTags: {
            type: 'string'
        }
    }
} as const;

type Input = FromSchema<typeof inputSchema>;

export const route: PostWithFileRoute<Input, EmptyOutput> = {
    method: 'post',
    path: '/reactor/addEntry',
    inputSchema,
    handler,
    authentication: 'user2',
    scope: 'admin',
    clientErrors: ['ITEM_ALREADY_EXISTS', 'FILE_REQUIRED'],
    outputSchema: emptyObjectSchema,
    file: true
};
