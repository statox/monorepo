#!/usr/bin/env tsx

/**
 *  Generate a typescript source file to be added to my frontend codebase.
 *
 *  11/2025 This whole tool is my first serious try at agentic code generation.
 *  I have already refined the output and fixed various typing issues.
 *  The README is largely LLM generated, I'm curious to see how it ages.
 *
 *  To be used with the npm helper:
 *
 *      npmr generate:sdk ../apps.statox.fr/src/vendor/statox-api
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nunjucks from 'nunjucks';
import type { ApiJsonSchema, Route } from '../src/libs/routes/types.js';

type RouteAuth = Route<unknown, unknown>['authentication'];

interface GroupedRoute {
    module: string;
    name: string;
    method: 'get' | 'post';
    path: string;
    inputSchema?: ApiJsonSchema;
    outputSchema: ApiJsonSchema;
    authentication: RouteAuth;
    clientErrors: string[];
}

// Group routes by module (first part of path)
export function groupRoutes(routesList: Route<unknown, unknown>[]): Map<string, GroupedRoute[]> {
    const grouped = new Map<string, GroupedRoute[]>();

    for (const route of routesList) {
        // Extract module and name from path: /homeTracker/getDashboard -> module: homeTracker, name: getDashboard
        const pathParts = route.path.split('/').filter((p) => p && !p.startsWith(':'));

        let module = pathParts[0] || 'root';
        let name = pathParts.slice(1).join('_') || 'index';

        // Special handling for single-part paths
        if (pathParts.length === 1) {
            module = 'misc';
            name = pathParts[0];
        }

        // Convert kebab-case module to camelCase so hyphens never appear in identifiers
        module = module.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

        // Remove special characters (dots, hyphens, etc) and replace with underscores
        name = name.replace(/[^a-zA-Z0-9_]/g, '_');

        // Convert to camelCase
        name = name.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

        const groupedRoute: GroupedRoute = {
            module,
            name,
            method: route.method,
            path: route.path,
            inputSchema: route.method === 'post' ? route.inputSchema : undefined,
            outputSchema: route.outputSchema,
            authentication: route.authentication,
            clientErrors: route.clientErrors ?? []
        };

        if (!grouped.has(module)) {
            grouped.set(module, []);
        }
        grouped.get(module)!.push(groupedRoute);
    }

    return grouped;
}

const AUTH_ERRORS: Record<RouteAuth, string[]> = {
    user2: ['UNAUTHORIZED', 'FORBIDDEN_FOR_USER', 'INVALID_SCOPE'],
    user: ['UNAUTHORIZED', 'FORBIDDEN_FOR_USER', 'INVALID_SCOPE'],
    apikey: ['MISSING_API_KEY', 'INVALID_AUTH_HEADER', 'UNKNOWN_API_KEY'],
    'apikey-iot': ['MISSING_API_KEY', 'INVALID_AUTH_HEADER', 'UNKNOWN_API_KEY'],
    none: []
};

// Generate the SDK client code
export function generateSDK(groupedRoutes: Map<string, GroupedRoute[]>): string {
    const templatesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'templates');
    const nunjucksEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader(templatesDir), {
        autoescape: false
    });

    const allSchemas: { [key: string]: ApiJsonSchema } = {};
    const modules: Array<{ name: string; methods: string }> = [];

    for (const [module, routes] of groupedRoutes) {
        const methods: string[] = [];

        for (const route of routes) {
            const inputSchemaName = `${module}_${route.name}_Input`;
            const outputSchemaName = `${module}_${route.name}_Output`;

            // Store schemas
            if (route.inputSchema) {
                allSchemas[inputSchemaName] = route.inputSchema;
            }
            allSchemas[outputSchemaName] = route.outputSchema;

            // Generate method signature
            const hasInput = route.method === 'post' && route.inputSchema;
            const inputType = hasInput ? generateNamedType(module, route.name, 'Input') : 'void';
            const outputType = generateNamedType(module, route.name, 'Output');

            const inputParam = hasInput ? `input: ${inputType}` : '';
            const pathParams = extractPathParams(route.path);
            const bundleType = generateBundleType(module, route.name);

            let params = inputParam || '';
            if (pathParams.length > 0) {
                const pathParamsType = `{ ${pathParams.map((p) => `${p}: string`).join(', ')} }`;
                params = params ? `${params}, params: ${pathParamsType}` : `params: ${pathParamsType}`;
            }

            // pathParamsTransform is only used for routes with a path parameter like /r/:linkId
            const pathParamsTransform = pathParams.length
                ? pathParams.map((p) => `.replace(':${p}', params.${p})`).join('')
                : '';

            const bodyArg = hasInput ? 'input' : 'null';

            const methodImplementation = nunjucksEnv.render('route.njk', {
                method: route.method.toUpperCase(),
                routePath: route.path,
                authentication: route.authentication,
                name: route.name,
                params,
                outputType,
                hasInput: Boolean(hasInput),
                inputSchemaName,
                outputSchemaName,
                module,
                pathParamsTransform,
                endpointBundleType: bundleType,
                bodyArg
            });

            methods.push(methodImplementation);
        }

        modules.push({ name: module, methods: methods.join('\n') });
    }

    const schemasJson = JSON.stringify(allSchemas, null, 2);

    const typeExports = Array.from(groupedRoutes.entries())
        .flatMap(([module, routes]) =>
            routes.flatMap((route) => {
                const types: string[] = [];
                const outputType = generateNamedType(module, route.name, 'Output');
                const bundleType = generateBundleType(module, route.name);

                if (route.inputSchema) {
                    const inputType = generateNamedType(module, route.name, 'Input');
                    types.push(
                        `export type ${inputType} = FromSchema<typeof schemas.${module}_${route.name}_Input>;`
                    );
                    types.push(
                        `export type ${outputType} = FromSchema<typeof schemas.${module}_${route.name}_Output>;`
                    );
                    types.push(`export type ${bundleType} = Endpoint<${outputType}, ${inputType}>;`);
                } else {
                    types.push(
                        `export type ${outputType} = FromSchema<typeof schemas.${module}_${route.name}_Output>;`
                    );
                    types.push(`export type ${bundleType} = Endpoint<${outputType}>;`);
                }

                const errorType = generateErrorType(module, route.name);
                const errorCodes = [
                    ...route.clientErrors,
                    ...AUTH_ERRORS[route.authentication],
                    ...(route.inputSchema ? ['INPUT_VALIDATION_FAILED'] : []),
                    'INTERNAL_SERVER_ERROR',
                    'NETWORK_ERROR'
                ];
                const errorUnion = errorCodes.map((c) => `'${c}'`).join(' | ');
                types.push(`export type ${errorType} = ${errorUnion};`);

                return types;
            })
        )
        .join('\n');

    return nunjucksEnv.render('sdk.njk', {
        generatedOn: new Date().toISOString(),
        schemasJson,
        modules,
        typeExports
    });
}

function extractPathParams(path: string): string[] {
    const matches = path.match(/:([a-zA-Z0-9_]+)/g);
    return matches ? matches.map((m) => m.slice(1)) : [];
}

function capitalizeFirst(str: string): string {
    // Convert kebab-case to PascalCase (e.g. "web-stats" -> "WebStats")
    return str
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

function generateNamedType(module: string, name: string, kind: 'Input' | 'Output'): string {
    return `${capitalizeFirst(module)}_${capitalizeFirst(name)}_${kind}`;
}

function generateBundleType(module: string, name: string): string {
    return `${capitalizeFirst(module)}_${capitalizeFirst(name)}`;
}

function generateErrorType(module: string, name: string): string {
    return `${capitalizeFirst(module)}_${capitalizeFirst(name)}_Errors`;
}

// Main execution
async function main() {
    const { routes } = await import('../src/libs/routes/index.js');
    const outputDir = process.argv[2] || './generated';
    const outputFile = path.join(outputDir, 'index.ts');

    console.log('1. Generating SDK...');
    console.log(`2. Found ${routes.list.length} routes`);

    const groupedRoutes = groupRoutes(routes.list);
    console.log(`3. Grouped into ${groupedRoutes.size} modules`);

    const sdkContent = generateSDK(groupedRoutes);

    // Ensure output directory exists
    fs.mkdirSync(outputDir, { recursive: true });

    // Write SDK file
    fs.writeFileSync(outputFile, sdkContent);

    console.log(`4. SDK generated successfully!`);
    console.log(`5. Output: ${outputFile}`);
    console.log(`\nModules:`);
    for (const [module, routes] of groupedRoutes) {
        console.log(`  - ${module} (${routes.length} endpoints)`);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}
