import Ajv, { type AnySchema, type ValidateFunction } from 'ajv';
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
        validation: { inputSchema?: AnySchema; outputSchema: AnySchema; endpoint: string },
        options: { method: 'GET' | 'POST' },
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
        const headers: Record<string, string> = {};

        if (bodyIsDefined) {
            headers['Content-Type'] = 'application/json';
        }
        if ((auth.type === 'apikey' || auth.type === 'apikey-iot') && this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        try {
            const response = await this.fetcher(url, {
                method: options.method,
                headers,
                body: bodyIsDefined ? JSON.stringify(body) : undefined,
                mode: 'cors',
                credentials: auth.type === 'user2' ? 'include' : 'omit'
            });

            if (!response.ok) {
                let code = 'INTERNAL_SERVER_ERROR';
                let reason: string | undefined;
                try {
                    const responseBody = await response.json();
                    if (typeof responseBody?.code === 'string') code = responseBody.code;
                    if (typeof responseBody?.reason === 'string') reason = responseBody.reason;
                } catch {
                    /* body was not JSON */
                }
                const error = new ApiError(response.status, code, reason);
                this.onError?.(error, validation.endpoint);
                throw error;
            }

            const output = await response.json();
            validateOutput(validation.outputSchema, output, validation.endpoint);
            return output;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            const err = new ApiError(0, 'NETWORK_ERROR', String(error));
            this.onError?.(err, validation.endpoint);
            throw err;
        }
    }
}

export function APIClient(config: APIClientConfig) {
    const base = new BaseAPIClient(config);
    return Object.assign(
        base,
        buildModules((p, b, v, o, a) => base._fetch(p, b, v, o, a))
    );
}

export type APIClient = ReturnType<typeof APIClient>;
