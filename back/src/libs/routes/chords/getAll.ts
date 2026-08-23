import { FromSchema } from 'json-schema-to-ts';
import { getAllChords } from '../../modules/chords/index.js';
import { EmptyInput, GetRoute } from '../types.js';

const handler = async () => {
    return await getAllChords();
};

const outputSchema = {
    type: 'array',
    items: {
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
    }
} as const;

export const route: GetRoute<EmptyInput, FromSchema<typeof outputSchema>> = {
    method: 'get',
    path: '/chords/getAll',
    handler,
    authentication: 'none',
    outputSchema
};
