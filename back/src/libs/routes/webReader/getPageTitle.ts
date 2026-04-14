import { FromSchema } from 'json-schema-to-ts';
import { PostRoute, RouteHandler } from '../types.js';
import { getPageTitle } from '../../modules/webReader/index.js';

const handler: RouteHandler<Input> = async (params) => {
    const { url } = params.input;
    params.loggableContext.addData('url', url);

    const title = await getPageTitle(url);
    return { title };
};

const inputSchema = {
    type: 'object',
    required: ['url'],
    additionalProperties: false,
    properties: {
        url: {
            type: 'string'
        }
    }
} as const;

const outputSchema = {
    type: 'object',
    required: ['title'],
    additionalProperties: false,
    properties: {
        title: {
            type: 'string'
        }
    }
} as const;

type Input = FromSchema<typeof inputSchema>;
type Output = FromSchema<typeof outputSchema>;

export const route: PostRoute<Input, Output> = {
    method: 'post',
    path: '/webReader/getPageTitle',
    inputSchema,
    outputSchema,
    handler,
    authentication: 'user2',
    scope: 'admin'
};
