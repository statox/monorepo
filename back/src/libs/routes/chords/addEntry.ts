import { FromSchema } from 'json-schema-to-ts';
import { EmptyOutput, PostRoute, RouteHandler } from '../types.js';
import { addChord } from '../../modules/chords/index.js';
import { emptyObjectSchema } from '../helpers.js';

const handler: RouteHandler<Input> = async (params) => {
    const { artist, title, url, tags } = params.input;
    params.loggableContext.addData('chords_newChordArtist', artist);
    params.loggableContext.addData('chords_newChordTitle', title);
    params.loggableContext.addData('chords_newChordUrl', url);
    params.loggableContext.addData('chords_newChordTags', tags);
    await addChord({ artist, title, url, tags });
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

export const route: PostRoute<Input, EmptyOutput> = {
    method: 'post',
    path: '/chords/addEntry',
    inputSchema,
    handler,
    authentication: 'user2',
    scope: 'admin',
    clientErrors: ['ITEM_ALREADY_EXISTS'],
    outputSchema: emptyObjectSchema
};
