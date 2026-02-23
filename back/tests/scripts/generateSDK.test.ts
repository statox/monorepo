import { assert } from 'chai';
import ts from 'typescript';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import sinon from 'sinon';
import { groupRoutes, generateSDK } from '../../scripts/generateSDK.js';
import type { Route } from '../../src/libs/routes/types.js';

// ---------------------------------------------------------------------------
// Shared mock schemas and routes
// ---------------------------------------------------------------------------

const outputSchema = {
    type: 'object',
    properties: { result: { type: 'string' } },
    required: ['result'],
    additionalProperties: false
};

const inputSchema = {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
    additionalProperties: false
};

const getDashboardRoute = {
    method: 'get',
    path: '/homeTracker/getDashboard',
    authentication: 'user2',
    scope: 'admin',
    outputSchema
} as unknown as Route<unknown, unknown>;

const addEntryRoute = {
    method: 'post',
    path: '/homeTracker/addEntry',
    authentication: 'user2',
    scope: 'admin',
    inputSchema,
    outputSchema
} as unknown as Route<unknown, unknown>;

const sensorDataRoute = {
    method: 'get',
    path: '/sensor/:id/data',
    authentication: 'apikey-iot',
    outputSchema
} as unknown as Route<unknown, unknown>;

const statusRoute = {
    method: 'get',
    path: '/status',
    authentication: 'none',
    outputSchema
} as unknown as Route<unknown, unknown>;

// ---------------------------------------------------------------------------

describe('scripts/generateSDK', () => {
    // -----------------------------------------------------------------------
    // Category 1 — groupRoutes unit tests
    // -----------------------------------------------------------------------

    describe('groupRoutes', () => {
        it('groups 2-level paths by module', () => {
            const grouped = groupRoutes([getDashboardRoute, addEntryRoute]);
            assert.isTrue(grouped.has('homeTracker'));
            assert.equal(grouped.get('homeTracker')!.length, 2);
        });

        it('assigns module=misc for single-segment paths', () => {
            const grouped = groupRoutes([statusRoute]);
            assert.isTrue(grouped.has('misc'));
            assert.equal(grouped.get('misc')![0].name, 'status');
        });

        it('strips path params from route name', () => {
            const grouped = groupRoutes([sensorDataRoute]);
            const routes = grouped.get('sensor')!;
            assert.equal(routes[0].name, 'data');
        });

        it('converts hyphenated segment names to camelCase', () => {
            const route = {
                method: 'get',
                path: '/a/get-items',
                authentication: 'none',
                outputSchema
            } as unknown as Route<unknown, unknown>;
            const grouped = groupRoutes([route]);
            assert.equal(grouped.get('a')![0].name, 'getItems');
        });

        it('joins multi-segment names with camelCase', () => {
            const route = {
                method: 'get',
                path: '/a/b/c',
                authentication: 'none',
                outputSchema
            } as unknown as Route<unknown, unknown>;
            const grouped = groupRoutes([route]);
            assert.equal(grouped.get('a')![0].name, 'bC');
        });

        it('does not include inputSchema for GET routes', () => {
            const grouped = groupRoutes([getDashboardRoute]);
            const route = grouped.get('homeTracker')![0];
            assert.isUndefined(route.inputSchema);
        });

        it('includes inputSchema for POST routes', () => {
            const grouped = groupRoutes([addEntryRoute]);
            const routes = grouped.get('homeTracker')!;
            const addEntry = routes.find((r) => r.name === 'addEntry')!;
            assert.isDefined(addEntry.inputSchema);
        });
    });

    // -----------------------------------------------------------------------
    // Category 2 — generateSDK output string assertions
    // -----------------------------------------------------------------------

    describe('generateSDK output', () => {
        let sdk: string;

        before(() => {
            const grouped = groupRoutes([getDashboardRoute, addEntryRoute, sensorDataRoute]);
            sdk = generateSDK(grouped);
        });

        it('uses named output types in method signatures', () => {
            assert.include(sdk, 'Promise<HomeTracker_GetDashboard_Output>');
            assert.notInclude(sdk, 'Promise<FromSchema<');
        });

        it('GET method has no input parameter', () => {
            assert.include(sdk, 'getDashboard: async ():');
        });

        it('POST method has typed input parameter', () => {
            assert.include(sdk, 'addEntry: async (input: HomeTracker_AddEntry_Input):');
        });

        it('path param appears in method signature', () => {
            assert.include(sdk, 'params: { id: string }');
        });

        it('path param is replaced in method body', () => {
            assert.include(sdk, ".replace(':id', params.id)");
        });

        it('POST method calls validateInput', () => {
            assert.include(sdk, 'validateInput(schemas.homeTracker_addEntry_Input');
        });

        it('GET method does not call validateInput', () => {
            assert.notInclude(sdk, 'validateInput(schemas.homeTracker_getDashboard_');
        });

        it('type exports reference named types via FromSchema', () => {
            assert.include(sdk, 'export type HomeTracker_GetDashboard_Output = FromSchema<');
        });

        it('no Input type is exported for GET routes', () => {
            assert.notInclude(sdk, 'HomeTracker_GetDashboard_Input');
        });

        it('output schema is embedded in schemas object, input schema is not', () => {
            assert.include(sdk, '"homeTracker_getDashboard_Output"');
            assert.notInclude(sdk, '"homeTracker_getDashboard_Input"');
        });

        it('authentication value appears in JSDoc for each route', () => {
            assert.include(sdk, '* Authentication: user2');
            assert.include(sdk, '* Authentication: apikey-iot');
        });
    });

    // -----------------------------------------------------------------------
    // Category 3 — TypeScript transpilation (in-memory)
    // -----------------------------------------------------------------------

    describe('TypeScript transpilation', () => {
        it('generated SDK transpiles without diagnostics', () => {
            const grouped = groupRoutes([getDashboardRoute, addEntryRoute, sensorDataRoute]);
            const sdk = generateSDK(grouped);

            const result = ts.transpileModule(sdk, {
                compilerOptions: {
                    target: ts.ScriptTarget.ES2022,
                    module: ts.ModuleKind.CommonJS,
                    esModuleInterop: true
                }
            });

            assert.deepEqual(result.diagnostics, []);
            assert.ok(result.outputText.length > 0);
        });
    });

    // -----------------------------------------------------------------------
    // Category 4 — Runtime instantiation (vm sandbox)
    // -----------------------------------------------------------------------

    describe('Runtime instantiation', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let APIClient: any;
        let fetchStub: sinon.SinonStub;

        before(() => {
            const grouped = groupRoutes([getDashboardRoute, addEntryRoute, sensorDataRoute]);
            const sdk = generateSDK(grouped);

            const result = ts.transpileModule(sdk, {
                compilerOptions: {
                    target: ts.ScriptTarget.ES2022,
                    module: ts.ModuleKind.CommonJS,
                    esModuleInterop: true
                }
            });
            const jsCode = result.outputText;

            const moduleExports: Record<string, unknown> = {};
            const moduleObj = { exports: moduleExports };
            const sandbox = vm.createContext({
                require: createRequire(import.meta.url),
                module: moduleObj,
                exports: moduleExports,
                console,
                // Arrow-function indirection keeps the stub reference swappable across beforeEach
                fetch: (...args: unknown[]) => fetchStub(...args)
            });
            vm.runInContext(jsCode, sandbox);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            APIClient = (moduleObj.exports as any).APIClient;
        });

        beforeEach(() => {
            fetchStub = sinon.stub();
        });

        it('APIClient can be instantiated', () => {
            const client = new APIClient({ baseURL: 'http://localhost:3000' });
            assert.ok(client);
        });

        it('GET method calls fetch with correct URL and method', async () => {
            fetchStub.resolves({
                ok: true,
                json: async () => ({ result: 'test' })
            });

            const client = new APIClient({ baseURL: 'http://localhost:3000' });
            const output = await client.homeTracker.getDashboard();

            assert.isTrue(fetchStub.calledOnce);
            const [url, options] = fetchStub.firstCall.args as [string, RequestInit];
            assert.include(url, '/homeTracker/getDashboard');
            assert.equal(options.method, 'GET');
            assert.deepEqual(output, { result: 'test' });
        });

        it('POST method calls fetch with correct URL, method, Content-Type and serialized body', async () => {
            fetchStub.resolves({
                ok: true,
                json: async () => ({ result: 'created' })
            });

            const client = new APIClient({ baseURL: 'http://localhost:3000' });
            await client.homeTracker.addEntry({ name: 'test' });

            assert.isTrue(fetchStub.calledOnce);
            const [url, options] = fetchStub.firstCall.args as [
                string,
                RequestInit & { headers: Record<string, string> }
            ];
            assert.include(url, '/homeTracker/addEntry');
            assert.equal(options.method, 'POST');
            assert.equal(options.headers['Content-Type'], 'application/json');
            assert.equal(options.body, JSON.stringify({ name: 'test' }));
        });

        it('POST method throws Invalid input before calling fetch for invalid input', async () => {
            const client = new APIClient({ baseURL: 'http://localhost:3000' });

            try {
                await client.homeTracker.addEntry({ invalid: 'field' });
                assert.fail('Expected an error to be thrown');
            } catch (err) {
                assert.include((err as Error).message, 'Invalid input');
                assert.equal(fetchStub.callCount, 0);
            }
        });

        it('output validation warns on schema mismatch without throwing', async () => {
            fetchStub.resolves({
                ok: true,
                json: async () => ({}) // missing required 'result' field
            });

            const warnStub = sinon.stub(console, 'warn');
            try {
                const client = new APIClient({ baseURL: 'http://localhost:3000' });
                await client.homeTracker.getDashboard();
                assert.isTrue(warnStub.calledOnce);
            } finally {
                warnStub.restore();
            }
        });
    });
});
