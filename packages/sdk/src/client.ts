import { Ajv, type AnySchema, type ValidateFunction } from 'ajv';
import { buildModules } from './generated/routes.js';
import type { AuthType } from './types.js';

const ajv = new Ajv();
const validators: Map<string, ValidateFunction> = new Map();

function getValidator(schema: AnySchema, key: string): ValidateFunction {
    if (!validators.has(key)) {
        validators.set(key, ajv.compile(schema));
    }
    return validators.get(key)!;
}

function validateInput(schema: AnySchema, data: unknown, endpoint: string): void {
    const validator = getValidator(schema, `input_${endpoint}`);
    if (!validator(data)) {
        throw new ApiError(
            0,
            'INPUT_VALIDATION_FAILED',
            `${endpoint}: ${ajv.errorsText(validator.errors)}`
        );
    }
}

function validateOutput(schema: AnySchema, data: unknown, endpoint: string): void {
    const validator = getValidator(schema, `output_${endpoint}`);
    if (!validator(data)) {
        console.warn(`Invalid output for ${endpoint}: ${ajv.errorsText(validator.errors)}`);
    }
}

export class ApiError<TCode extends string = string> extends Error {
    readonly httpStatus: number;
    readonly code: TCode;
    readonly reason?: string;

    constructor(httpStatus: number, code: TCode, reason?: string) {
        super(code);
        this.name = 'ApiError';
        this.httpStatus = httpStatus;
        this.code = code;
        this.reason = reason;
    }
}

export interface APIClientConfig {
    baseURL: string;
    apiKey?: string;
    onError?: (error: ApiError, endpoint: string) => void;
    fetcher?: typeof globalThis.fetch;
}

export class BaseAPIClient {
    private baseURL: string;
    private apiKey?: string;
    private onError?: (error: ApiError, endpoint: string) => void;
    private fetcher: typeof globalThis.fetch;

    constructor(config: APIClientConfig) {
        this.baseURL = config.baseURL.replace(/\/$/, '');
        this.apiKey = config.apiKey;
        this.onError = config.onError;
        this.fetcher = config.fetcher ?? globalThis.fetch;
    }

    async _fetch(
        path: string,
        body: null | unknown,
        file: File | Blob | null,
        validation: { inputSchema?: AnySchema; outputSchema: AnySchema; endpoint: string },
        options: { method: 'GET' | 'POST'; keepalive?: true },
        auth: { type: AuthType }
    ): Promise<unknown> {
        const bodyIsDefined = body !== null;
        if (bodyIsDefined) {
            if (!validation.inputSchema) {
                throw new ApiError(0, 'INPUT_VALIDATION_FAILED', 'Missing input schema');
            }
            validateInput(validation.inputSchema, body, validation.endpoint);
        }

        const url = `${this.baseURL}${path}`;
        const headers: Record<string, string> = { Accept: 'application/json' };
        const credentials: RequestCredentials = auth.type === 'user2' ? 'include' : 'omit';

        if ((auth.type === 'apikey' || auth.type === 'apikey-iot') && this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        let fetchBody: BodyInit | undefined;
        if (file) {
            const form = new FormData();
            if (body) {
                for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
                    // This works for now because we send only primitives but sending objects/arrays
                    // would silently send "[object Object]" If that happens we'll need JSON.stringify
                    if (value !== undefined) form.append(key, String(value));
                }
            }
            form.append('file', file);
            fetchBody = form;
        } else if (bodyIsDefined) {
            headers['Content-Type'] = 'application/json';
            fetchBody = JSON.stringify(body);
        }

        let response: Response;
        try {
            response = await this.fetcher(url, {
                method: options.method,
                headers,
                body: fetchBody,
                credentials,
                mode: 'cors',
                /** Prevent the browser to interrupt a call
                 * when the page closes. We use `keepalive` for web
                 *analytics only
                 */
                keepalive: options.keepalive
            });
        } catch (err) {
            const networkError = new ApiError(0, 'NETWORK_ERROR', String(err));
            this.onError?.(networkError, validation.endpoint);
            throw networkError;
        }

        if (!response.ok) {
            let code = 'INTERNAL_SERVER_ERROR';
            let reason: string | undefined;
            try {
                const errorBody = await response.json();
                if (errorBody != null && typeof errorBody.code === 'string') code = errorBody.code;
                if (errorBody != null && typeof errorBody.reason === 'string')
                    reason = errorBody.reason;
            } catch {
                // ignore JSON parse errors on error responses
            }
            const apiError = new ApiError(response.status, code, reason);
            this.onError?.(apiError, validation.endpoint);
            throw apiError;
        }

        const output = await response.json();
        validateOutput(validation.outputSchema, output, validation.endpoint);
        return output;
    }
}

export function APIClient(config: APIClientConfig) {
    const base = new BaseAPIClient(config);

    // makeModules wraps buildModules so every generated route call merges extraOptions
    // into the native fetch options. Called with no args for the default client modules;
    // called by withOptions to produce a one-shot proxy with caller-supplied overrides
    // (e.g. keepalive: true for telemetry that must survive page navigation).
    const makeModules = (extraOptions: { keepalive?: true } = {}) =>
        buildModules((path, body, file, validation, options, auth) =>
            base._fetch(path, body, file, validation, { ...options, ...extraOptions }, auth)
        );

    return Object.assign(base, makeModules(), {
        withOptions: (opts: { keepalive?: true }) => makeModules(opts)
    });
}

export type APIClient = ReturnType<typeof APIClient>;
