import { FromSchema } from 'json-schema-to-ts';
import { checkChordsUrl } from '../../modules/chords/index.js';
import { EmptyInput, GetRoute } from '../types.js';

const handler = async () => {
    return await checkChordsUrl();
};

const outputSchema = {
    type: 'object',
    properties: {
        nbChecks: {
            type: 'number'
        },
        nbSkipped: {
            type: 'number'
        },
        nbFails: {
            type: 'number'
        },
        timestamp: {
            type: 'number'
        },
        fails: {
            type: 'array',
            minItems: 0,
            items: {
                type: 'object',
                properties: {
                    status: {
                        type: 'string'
                    },
                    chord: {
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
                    },
                    error: {
                        type: 'object'
                    }
                },
                required: ['status', 'chord'],
                additionalProperties: false
            }
        }
    },
    required: ['nbChecks', 'nbSkipped', 'nbFails', 'timestamp', 'fails'],
    additionalProperties: false
} as const;

export const route: GetRoute<EmptyInput, FromSchema<typeof outputSchema>> = {
    method: 'get',
    path: '/chords/checkLinks',
    handler,
    authentication: 'none',
    outputSchema
};
