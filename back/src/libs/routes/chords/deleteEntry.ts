import { FromSchema } from 'json-schema-to-ts';
import { EmptyOutput, PostRoute, RouteHandler } from '../types.js';
import { deleteChord } from '../../modules/chords/index.js';
import { emptyObjectSchema } from '../helpers.js';

const handler: RouteHandler<Input> = async (params) => {
    const { id } = params.input;
    params.loggableContext.addData('id', id);
    await deleteChord(id);
};

const inputSchema = {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: {
        id: {
            type: 'number',
            description: 'id of the chord to delete'
        }
    }
} as const;

type Input = FromSchema<typeof inputSchema>;

export const route: PostRoute<Input, EmptyOutput> = {
    method: 'post',
    path: '/chords/deleteEntry',
    inputSchema,
    handler,
    authentication: 'user2',
    scope: 'admin',
    outputSchema: emptyObjectSchema
};
