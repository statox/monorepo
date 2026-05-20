import { assert } from 'chai';
import sinon from 'sinon';
import type { AnySchema } from 'ajv';
import { APIClient, BaseAPIClient, ApiError } from '../src/client.js';

const outputSchema: AnySchema = {
    type: 'object',
    properties: { result: { type: 'string' } },
    required: ['result'],
    additionalProperties: false
};

const inputSchema: AnySchema = {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
    additionalProperties: false
};

const validation = { outputSchema, endpoint: 'test.endpoint' };

function makeClient(
    extra: Partial<{
        apiKey: string;
        onError: (e: ApiError, path: string) => void;
    }> = {}
) {
    const fetchStub = sinon.stub<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
    const client = new BaseAPIClient({
        baseURL: 'http://localhost:3000',
        fetcher: fetchStub as unknown as typeof fetch,
        ...extra
    });
    return { client, fetchStub };
}

describe('BaseAPIClient', () => {
    it('can be instantiated', () => {
        const { client } = makeClient();
        assert.ok(client);
    });

    it('GET call uses correct URL and method', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({ result: 'test' })
        } as Response);

        await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'none' });

        const [url, opts] = fetchStub.firstCall.args;
        assert.equal(url, 'http://localhost:3000/test/get');
        assert.equal((opts as RequestInit).method, 'GET');
    });

    it('strips trailing slash from baseURL', async () => {
        const fetchStub = sinon.stub<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({ result: 'test' })
        } as Response);
        const client = new BaseAPIClient({
            baseURL: 'http://localhost:3000/',
            fetcher: fetchStub as unknown as typeof fetch
        });

        await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'none' });

        const [url] = fetchStub.firstCall.args;
        assert.equal(url, 'http://localhost:3000/test/get');
    });

    it('POST call sends JSON body and Content-Type header', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({ result: 'ok' })
        } as Response);

        await client._fetch(
            '/test/post',
            { name: 'test' },
            { inputSchema, outputSchema, endpoint: 'test.post' },
            { method: 'POST' },
            { type: 'none' }
        );

        const [, opts] = fetchStub.firstCall.args;
        const headers = (opts as RequestInit & { headers: Record<string, string> }).headers;
        assert.equal(headers['Content-Type'], 'application/json');
        assert.equal((opts as RequestInit).body, JSON.stringify({ name: 'test' }));
    });

    it('POST call validates input before calling fetch', async () => {
        const { client, fetchStub } = makeClient();

        try {
            await client._fetch(
                '/test/post',
                { invalid: true },
                { inputSchema, outputSchema, endpoint: 'test.post' },
                { method: 'POST' },
                { type: 'none' }
            );
            assert.fail('Expected error');
        } catch (err) {
            assert.instanceOf(err, ApiError);
            assert.propertyVal(err as object, 'code', 'INPUT_VALIDATION_FAILED');
            assert.equal(fetchStub.callCount, 0);
        }
    });

    it('POST call validates input — throws ApiError with INPUT_VALIDATION_FAILED', async () => {
        const { client, fetchStub } = makeClient();

        try {
            await client._fetch(
                '/test/post',
                { invalid: true },
                { inputSchema, outputSchema, endpoint: 'test.post' },
                { method: 'POST' },
                { type: 'none' }
            );
            assert.fail('Expected error');
        } catch (err) {
            assert.instanceOf(err, ApiError);
            assert.propertyVal(err as object, 'code', 'INPUT_VALIDATION_FAILED');
            assert.equal(fetchStub.callCount, 0);
        }
    });

    it('calls onError callback on NETWORK_ERROR', async () => {
        const onError = sinon.stub();
        const { client, fetchStub } = makeClient({ onError });
        fetchStub.rejects(new Error('Network failure'));

        try {
            await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'none' });
        } catch {
            /* expected */
        }

        assert.isTrue(onError.calledOnce);
        assert.instanceOf(onError.firstCall.args[0], ApiError);
        assert.propertyVal(onError.firstCall.args[0] as object, 'code', 'NETWORK_ERROR');
    });

    it('apikey auth sends Authorization header when apiKey configured', async () => {
        const { client, fetchStub } = makeClient({ apiKey: 'my-key' });
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({ result: 'test' })
        } as Response);

        await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'apikey' });

        const [, opts] = fetchStub.firstCall.args;
        const headers = (opts as RequestInit & { headers: Record<string, string> }).headers;
        assert.equal(headers['Authorization'], 'Bearer my-key');
    });

    it('warns on output schema mismatch without throwing', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({}) // missing required 'result'
        } as Response);

        const warnStub = sinon.stub(console, 'warn');
        try {
            await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'none' });
            assert.isTrue(warnStub.calledOnce);
        } finally {
            warnStub.restore();
        }
    });

    it('user2 auth sends credentials: include', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({ result: 'test' })
        } as Response);

        await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'user2' });

        const [, opts] = fetchStub.firstCall.args;
        assert.equal((opts as RequestInit).credentials, 'include');
    });

    it('non-user2 auth sends credentials: omit', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({ result: 'test' })
        } as Response);

        await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'none' });

        const [, opts] = fetchStub.firstCall.args;
        assert.equal((opts as RequestInit).credentials, 'omit');
    });

    it('apikey-iot auth sends Authorization header when apiKey configured', async () => {
        const { client, fetchStub } = makeClient({ apiKey: 'my-key' });
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({ result: 'test' })
        } as Response);

        await client._fetch(
            '/test/get',
            null,
            validation,
            { method: 'GET' },
            { type: 'apikey-iot' }
        );

        const [, opts] = fetchStub.firstCall.args;
        const headers = (opts as RequestInit & { headers: Record<string, string> }).headers;
        assert.equal(headers['Authorization'], 'Bearer my-key');
    });

    it('apikey-iot auth omits Authorization header when no apiKey', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({ result: 'test' })
        } as Response);

        await client._fetch(
            '/test/get',
            null,
            validation,
            { method: 'GET' },
            { type: 'apikey-iot' }
        );

        const [, opts] = fetchStub.firstCall.args;
        const headers = (opts as RequestInit & { headers: Record<string, string> }).headers;
        assert.isUndefined(headers['Authorization']);
    });

    it('throws ApiError with code and httpStatus on HTTP error', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.resolves({
            ok: false,
            status: 404,
            json: () =>
                Promise.resolve({ httpStatus: 404, code: 'ITEM_NOT_FOUND', reason: 'No item' })
        } as Response);

        try {
            await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'none' });
            assert.fail('Expected error');
        } catch (err) {
            assert.instanceOf(err, ApiError);
            assert.propertyVal(err as object, 'httpStatus', 404);
            assert.propertyVal(err as object, 'code', 'ITEM_NOT_FOUND');
            assert.propertyVal(err as object, 'reason', 'No item');
        }
    });

    it('throws ApiError with INTERNAL_SERVER_ERROR when response body has no code', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.resolves({
            ok: false,
            status: 500,
            json: () => Promise.resolve({})
        } as Response);

        try {
            await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'none' });
            assert.fail('Expected error');
        } catch (err) {
            assert.instanceOf(err, ApiError);
            assert.propertyVal(err as object, 'httpStatus', 500);
            assert.propertyVal(err as object, 'code', 'INTERNAL_SERVER_ERROR');
        }
    });

    it('throws ApiError with NETWORK_ERROR when fetch rejects', async () => {
        const { client, fetchStub } = makeClient();
        fetchStub.rejects(new Error('Network failure'));

        try {
            await client._fetch('/test/get', null, validation, { method: 'GET' }, { type: 'none' });
            assert.fail('Expected error');
        } catch (err) {
            assert.instanceOf(err, ApiError);
            assert.propertyVal(err as object, 'code', 'NETWORK_ERROR');
            assert.propertyVal(err as object, 'httpStatus', 0);
        }
    });

    it('calls onError callback on HTTP error', async () => {
        const onError = sinon.stub();
        const { client, fetchStub } = makeClient({ onError });
        fetchStub.resolves({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ code: 'UNAUTHORIZED' })
        } as Response);

        try {
            await client._fetch(
                '/test/get',
                null,
                validation,
                { method: 'GET' },
                { type: 'user2' }
            );
        } catch {
            /* expected */
        }

        assert.isTrue(onError.calledOnce);
        assert.instanceOf(onError.firstCall.args[0], ApiError);
        assert.propertyVal(onError.firstCall.args[0] as object, 'code', 'UNAUTHORIZED');
    });
});

describe('APIClient factory', () => {
    it('returns a BaseAPIClient instance with _fetch callable', async () => {
        const fetchStub = sinon.stub<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
        fetchStub.resolves({
            ok: true,
            json: () => Promise.resolve({ result: 'test' })
        } as Response);

        const client = APIClient({
            baseURL: 'http://localhost:3000',
            fetcher: fetchStub as unknown as typeof fetch
        });

        assert.instanceOf(client, BaseAPIClient);

        await client._fetch(
            '/test/get',
            null,
            {
                outputSchema: {
                    type: 'object',
                    properties: { result: { type: 'string' } },
                    required: ['result'],
                    additionalProperties: false
                },
                endpoint: 'test.get'
            },
            { method: 'GET' },
            { type: 'none' }
        );

        assert.equal(fetchStub.callCount, 1);
        assert.equal(fetchStub.firstCall.args[0], 'http://localhost:3000/test/get');
    });
});
