import { FromSchema } from 'json-schema-to-ts';
import { PostRoute, RouteHandler } from '../types.js';
import { insertChordAndExtractContent } from '../../modules/chords/index.js';

const handler: RouteHandler<Input> = async (params) => {
    const { artist, title, url, tags } = params.input;
    params.loggableContext.addData('chords_newChordArtist', artist);
    params.loggableContext.addData('chords_newChordTitle', title);
    params.loggableContext.addData('chords_newChordUrl', url);
    params.loggableContext.addData('chords_newChordTags', tags);
    return await insertChordAndExtractContent({ artist, title, url, tags });
};

const inputSchema = {
    type: 'object',
    required: ['artist', 'title', 'url', 'tags'],
    additionalProperties: false,
    properties: {
        artist: {
            type: 'string',
            minLength: 1
        },
        title: {
            type: 'string',
            minLength: 1
        },
        url: {
            type: 'string',
            minLength: 1
        },
        tags: {
            type: 'array',
            items: {
                type: 'string'
            }
        }
    }
} as const;

type Input = FromSchema<typeof inputSchema>;

const outputSchema = {
    type: 'object',
    required: ['status', 'label', 'reason'],
    additionalProperties: false,
    properties: {
        status: {
            type: 'string',
            enum: ['OK', 'SKIPPED', 'FAILED']
        },
        label: {
            type: 'string'
        },
        reason: {
            type: 'string'
        }
    }
} as const;

type Output = FromSchema<typeof outputSchema>;

export const route: PostRoute<Input, Output> = {
    method: 'post',
    path: '/chords/addEntry',
    inputSchema,
    handler,
    authentication: 'user2',
    scope: 'admin',
    clientErrors: ['ITEM_ALREADY_EXISTS'],
    outputSchema
};
