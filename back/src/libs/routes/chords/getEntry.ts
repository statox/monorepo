import { FromSchema } from 'json-schema-to-ts';
import { PostRoute, RouteHandler } from '../types.js';
import { getChordById } from '../../modules/chords/index.js';

const handler: RouteHandler<Input> = async (params) => {
    const { id } = params.input;

    return await getChordById(id);
};

const inputSchema = {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: {
        id: {
            type: 'number'
        }
    }
} as const;

type Input = FromSchema<typeof inputSchema>;

const outputSchema = {
    type: 'object',
    properties: {
        id: { type: 'number' },
        artist: { type: 'string' },
        title: { type: 'string' },
        url: { type: 'string' },
        creationDateUnix: { type: 'number' },
        tags: {
            type: 'array',
            items: { type: 'string' }
        },
        contentB64: { type: ['string', 'null'] },
        visitsCount: { type: 'number' },
        lastAccessDateUnix: { type: ['number', 'null'] }
    },
    required: [
        'id',
        'artist',
        'title',
        'url',
        'creationDateUnix',
        'tags',
        'contentB64',
        'visitsCount',
        'lastAccessDateUnix'
    ],
    additionalProperties: false
} as const;

export const route: PostRoute<Input, FromSchema<typeof outputSchema>> = {
    method: 'post',
    path: '/chords/getEntry',
    inputSchema,
    handler,
    authentication: 'none',
    outputSchema,
    clientErrors: ['ITEM_NOT_FOUND']
};
