import { FromSchema } from 'json-schema-to-ts';
import { EmptyOutput, PostRoute, RouteHandler } from '../types.js';
import { updateChord } from '../../modules/chords/index.js';
import { emptyObjectSchema } from '../helpers.js';

const handler: RouteHandler<Input> = async (params) => {
    const { id, artist, title, url, tags, contentB64 } = params.input;
    params.loggableContext.addData('id', id);
    params.loggableContext.addData('chords_updatedChordArtist', artist);
    params.loggableContext.addData('chords_updatedChordTitle', title);
    params.loggableContext.addData('chords_updatedChordUrl', url);
    params.loggableContext.addData('chords_updatedChordTags', tags);
    await updateChord({ id, artist, title, url, tags, contentB64 });
};

const inputSchema = {
    type: 'object',
    required: ['id', 'artist', 'title', 'url', 'tags'],
    additionalProperties: false,
    properties: {
        id: {
            type: 'number'
        },
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
        },
        contentB64: {
            type: ['string', 'null']
        }
    }
} as const;

type Input = FromSchema<typeof inputSchema>;

export const route: PostRoute<Input, EmptyOutput> = {
    method: 'post',
    path: '/chords/updateEntry',
    inputSchema,
    handler,
    authentication: 'user2',
    scope: 'admin',
    clientErrors: ['ITEM_ALREADY_EXISTS', 'ITEM_NOT_FOUND'],
    outputSchema: emptyObjectSchema
};
