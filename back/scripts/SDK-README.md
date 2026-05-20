# SDK Generator

`back/scripts/generateSDK.ts` reads the compiled route registry and produces the TypeScript SDK package at `packages/sdk/`.

## How it works

1. Loads the compiled route list from `dist/src/libs/routes/index.js`
2. Groups routes by module (first path segment)
3. Renders `back/scripts/templates/sdk.njk` + `route.njk` via Nunjucks to produce `packages/sdk/src/generated/routes.ts`

The generated file contains the AJV schemas, TypeScript types, and thin arrow-function wrappers used by `APIClient`.

## Usage

```bash
cd back && npm run generate:sdk
```

Run this after adding or modifying any backend route. Commit both the route change and the updated `packages/sdk/src/generated/routes.ts` together.

## SDK package

The generated output lives in `packages/sdk/`. See [`packages/sdk/README.md`](../../packages/sdk/README.md) for how to consume the SDK in the frontend.
