import { assert } from 'chai';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
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
    before(() => {
        // generateSDK uses a nunjucks FileSystemLoader relative to its compiled location
        // (dist/scripts/templates/). Copy source templates there so tests don't depend on
        // postinstall having been run since the templates were last modified.
        const srcTemplates = fileURLToPath(new URL('../../../scripts/templates', import.meta.url));
        const destTemplates = fileURLToPath(
            new URL('../../../dist/scripts/templates', import.meta.url)
        );
        fs.cpSync(srcTemplates, destTemplates, { recursive: true });
    });

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

        it('preserves clientErrors from route definition', () => {
            const route = {
                method: 'get',
                path: '/homeTracker/getDashboard',
                authentication: 'user2',
                scope: 'admin',
                outputSchema,
                clientErrors: ['ITEM_NOT_FOUND', 'ITEM_ALREADY_EXISTS']
            } as unknown as Route<unknown, unknown>;
            const grouped = groupRoutes([route]);
            const r = grouped.get('homeTracker')![0];
            assert.deepEqual(r.clientErrors, ['ITEM_NOT_FOUND', 'ITEM_ALREADY_EXISTS']);
        });

        it('defaults clientErrors to empty array when route has none', () => {
            const grouped = groupRoutes([getDashboardRoute]); // getDashboardRoute has no clientErrors
            const r = grouped.get('homeTracker')![0];
            assert.deepEqual(r.clientErrors, []);
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
            assert.include(sdk, 'getDashboard: () =>');
        });

        it('POST method has typed input parameter', () => {
            assert.include(sdk, 'addEntry: (input: HomeTracker_AddEntry_Input) =>');
        });

        it('path param appears in method signature', () => {
            assert.include(sdk, 'params: { id: string }');
        });

        it('path param is replaced in method body', () => {
            assert.include(sdk, ".replace(':id', params.id)");
        });

        it('POST method passes inputSchema in validation object', () => {
            assert.include(sdk, 'inputSchema: schemas.homeTracker_addEntry_Input');
        });

        it('GET method passes null as the body argument to fetch', () => {
            assert.include(sdk, "fetch('/homeTracker/getDashboard', null,");
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

        it('authentication value appears in route JSDoc', () => {
            assert.include(sdk, '* Auth: user2');
            assert.include(sdk, '* Auth: apikey-iot');
        });

        it('exports a bundle type for POST routes', () => {
            assert.include(
                sdk,
                'export type HomeTracker_AddEntry = Endpoint<HomeTracker_AddEntry_Output, HomeTracker_AddEntry_Input>'
            );
        });

        it('exports a bundle type for GET routes (body defaults to null)', () => {
            assert.include(
                sdk,
                'export type HomeTracker_GetDashboard = Endpoint<HomeTracker_GetDashboard_Output>'
            );
        });

        it('apikey-iot route does not include apiKey in method params', () => {
            assert.notInclude(sdk, 'apiKey: string');
        });

        it('exports an _Errors union type for every endpoint', () => {
            assert.include(sdk, 'export type HomeTracker_GetDashboard_Errors =');
            assert.include(sdk, 'export type HomeTracker_AddEntry_Errors =');
            assert.include(sdk, 'export type Sensor_Data_Errors =');
        });

        it('user2 _Errors type includes UNAUTHORIZED, FORBIDDEN_FOR_USER, INVALID_SCOPE', () => {
            // getDashboardRoute and addEntryRoute are user2
            assert.include(sdk, "'UNAUTHORIZED'");
            assert.include(sdk, "'FORBIDDEN_FOR_USER'");
            assert.include(sdk, "'INVALID_SCOPE'");
        });

        it('apikey-iot _Errors type includes MISSING_API_KEY, INVALID_AUTH_HEADER, UNKNOWN_API_KEY', () => {
            // sensorDataRoute is apikey-iot
            assert.include(sdk, "'MISSING_API_KEY'");
            assert.include(sdk, "'INVALID_AUTH_HEADER'");
            assert.include(sdk, "'UNKNOWN_API_KEY'");
        });

        it('all _Errors types include INTERNAL_SERVER_ERROR and NETWORK_ERROR', () => {
            assert.include(sdk, "'INTERNAL_SERVER_ERROR'");
            assert.include(sdk, "'NETWORK_ERROR'");
        });

        it('clientErrors codes appear in _Errors union', () => {
            const routeWithErrors = {
                method: 'post',
                path: '/homeTracker/addEntry',
                authentication: 'user2',
                scope: 'admin',
                inputSchema,
                outputSchema,
                clientErrors: ['ITEM_NOT_FOUND', 'ITEM_ALREADY_EXISTS']
            } as unknown as Route<unknown, unknown>;
            const grouped = groupRoutes([routeWithErrors]);
            const sdkWithErrors = generateSDK(grouped);
            assert.include(sdkWithErrors, "'ITEM_NOT_FOUND'");
            assert.include(sdkWithErrors, "'ITEM_ALREADY_EXISTS'");
        });

        it('output contains buildModules function', () => {
            assert.include(sdk, 'export function buildModules(');
        });

        it('output does not contain APIClient class', () => {
            assert.notInclude(sdk, 'class APIClient');
        });

        it('output does not contain AJV instantiation', () => {
            assert.notInclude(sdk, 'new Ajv()');
        });
    });

    // -----------------------------------------------------------------------
    // Category 3 — TypeScript transpilation (in-memory)
    // -----------------------------------------------------------------------

    describe('TypeScript transpilation', () => {
        it('generated routes.ts transpiles without diagnostics', () => {
            const grouped = groupRoutes([getDashboardRoute, addEntryRoute, sensorDataRoute]);
            const sdk = generateSDK(grouped);

            // Written alongside the real generated SDK (packages/sdk/src/generated/routes.ts)
            // so relative imports (../types.js) and package imports (json-schema-to-ts)
            // resolve against the sdk package's own node_modules, same as the real file.
            const tmpFile = fileURLToPath(
                new URL(
                    '../../../../packages/sdk/src/generated/__generateSDK_test_tmp__.ts',
                    import.meta.url
                )
            );
            const tscBin = fileURLToPath(
                new URL('../../../node_modules/.bin/tsc', import.meta.url)
            );
            // Use -p rather than passing this file + loose CLI compiler-option flags: that
            // way the check runs under the sdk package's real tsconfig.json (strict, lib,
            // checkJs, ...) instead of a hand-picked subset that can silently drift from it.
            const sdkTsconfig = fileURLToPath(
                new URL('../../../../packages/sdk/tsconfig.json', import.meta.url)
            );

            fs.writeFileSync(tmpFile, sdk);
            try {
                const result = spawnSync(tscBin, ['--noEmit', '-p', sdkTsconfig], {
                    encoding: 'utf8'
                });

                assert.equal(
                    result.status,
                    0,
                    `tsc reported diagnostics:\n${result.stdout}${result.stderr}`
                );
            } finally {
                fs.rmSync(tmpFile, { force: true });
            }

            assert.include(sdk, 'buildModules');
        });
    });
});
