# SDK Rework - fetch Typing POC

## Goal

Write a standalone POC in `back/index-tmp.ts` that demonstrates the new typed `fetch` signature.
It must compile, run, and pass the linter.

## The Typing Design

```typescript
import { JSONSchema } from 'json-schema-to-ts';

type AuthType = 'none' | 'user2' | 'apikey-iot' | 'apikey';

interface Endpoint<TOutput, TBody = null> {
    output: TOutput;
    body: TBody;
}

// Example endpoint types (in real SDK these are generated):
type Auth_Login = Endpoint<{ token: string }, { username: string; password: string }>;
type Chords_GetAll = Endpoint<{ chords: string[] }>; // GET, body defaults to null

class APIClient {
    private baseURL: string;
    private credentials: RequestCredentials;
    private apiKey?: string;
    private onError?: (error: Error, endpoint: string) => void;

    constructor(config: {
        baseURL: string;
        credentials?: RequestCredentials;
        apiKey?: string;
        onError?: (error: Error, endpoint: string) => void;
    }) {
        this.baseURL = config.baseURL.replace(/\/$/, '');
        this.credentials = config.credentials ?? 'include';
        this.apiKey = config.apiKey;
        this.onError = config.onError;
    }

    private async fetch<TEndpoint extends Endpoint<unknown, unknown>>(
        path: string,
        body: TEndpoint['body'],
        validation: { inputSchema?: JSONSchema; outputSchema: JSONSchema; endpoint: string },
        options: { method: 'GET' | 'POST' },
        auth: { type: AuthType }
    ): Promise<TEndpoint['output']> {
        // input validation
        // if (body && validation.inputSchema) validateInput(...)

        const url = `${this.baseURL}${path}`;
        const headers: Record<string, string> = {};

        if (body !== null) {
            headers['Content-Type'] = 'application/json';
        }
        if ((auth.type === 'apikey' || auth.type === 'apikey-iot') && this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        try {
            const response = await fetch(url, {
                method: options.method,
                headers,
                body: body !== null ? JSON.stringify(body) : undefined,
                mode: 'cors',
                credentials: this.credentials
            });

            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                this.onError?.(error, path);
                throw error;
            }

            const output = await response.json();
            // validateOutput(validation.outputSchema, output, validation.endpoint);
            return output as TEndpoint['output'];
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.onError?.(err, path);
            throw err;
        }
    }

    auth = {
        login: async (body: Auth_Login['body']) =>
            this.fetch<Auth_Login>(
                '/auth/login', body,
                { outputSchema: {}, endpoint: 'auth.login' },
                { method: 'POST' },
                { type: 'none' }
            ),
    };

    chords = {
        getAll: async () =>
            this.fetch<Chords_GetAll>(
                '/chords/getAll', null,
                { outputSchema: {}, endpoint: 'chords.getAll' },
                { method: 'GET' },
                { type: 'user2' }
            ),
    };
}
```

## What to Verify

DONE 1. TypeScript compiles without errors (`npx tsc --noEmit` in `back/`)
DONE 2. Linter passes (`npm run lint` in `back/`)
DONE 3. The `body` type is correctly inferred at call sites (POST gets the input type, GET forces `null`)
DONE 4. The return type of each method is correctly `Promise<TEndpoint['output']>`

## File to Create

DONE `back/index-tmp.ts` - delete after POC is validated.


## Conclusion

This design is approved to be used in the final plan
