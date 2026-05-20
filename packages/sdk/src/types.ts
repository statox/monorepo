import type { AnySchema } from 'ajv';

export type AuthType = 'none' | 'user2' | 'apikey-iot' | 'apikey';

export interface Endpoint<TOutput, TBody = null> {
    output: TOutput;
    body: TBody;
}

export type FetchFn = (
    path: string,
    body: null | unknown,
    validation: { inputSchema?: AnySchema; outputSchema: AnySchema; endpoint: string },
    options: { method: 'GET' | 'POST' },
    auth: { type: AuthType }
) => Promise<unknown>;
