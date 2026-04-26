import { EmptyInput, EmptyOutput, GetRoute } from '../types.js';
import { emptyObjectSchema } from '../helpers.js';

export const route: GetRoute<EmptyInput, EmptyOutput> = {
    method: 'get',
    path: '/youtube/auth/start',
    authentication: 'google',
    outputSchema: emptyObjectSchema,
    handler: async () => {}
};
