import { EmptyInput, EmptyOutput, PostRoute } from '../types.js';
import { emptyObjectSchema } from '../helpers.js';

export const route: PostRoute<EmptyInput, EmptyOutput> = {
    method: 'post',
    path: '/youtube/auth/logout',
    authentication: 'google',
    inputSchema: emptyObjectSchema,
    outputSchema: emptyObjectSchema,
    handler: async () => ({})
};
