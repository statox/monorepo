import { FromSchema } from 'json-schema-to-ts';
import { PostRoute, RouteHandler } from '../types.js';
import { extractChordData } from '../../modules/chords/index.js';

const handler: RouteHandler<Input> = async (params) => {
    const { id } = params.input;

    return await extractChordData(id);
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
    path: '/chords/extractEntry',
    inputSchema,
    handler,
    authentication: 'user2',
    scope: 'admin',
    clientErrors: ['ITEM_NOT_FOUND'],
    outputSchema
};
