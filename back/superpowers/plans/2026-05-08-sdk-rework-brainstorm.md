# SDK Rework - Brainstorm Summary

## Context

We want to rework the SDK generation after changing the error handling system in the backend.
Goal: improve generation, centralize logic, reduce code duplication before introducing new logic.

Files involved:
- `back/scripts/generateSDK.ts` - SDK generator
- `back/scripts/templates/sdk.njk` - SDK boilerplate template
- `back/scripts/templates/route.njk` - per-endpoint method template
- `front/src/vendor/statox-api/index.ts` - generated SDK (do not edit manually)

## Decisions Made

### 1. New `fetch` signature shape

Chosen approach: **5 params, body implicit** (option C from the discussion).

`fetch` receives `body` as a param. For POST routes, `fetch` internally uses it as the request body (JSON.stringify + Content-Type header). Callers never pass `body` in `options`.

```typescript
private async fetch<TEndpoint extends Endpoint<unknown, unknown>>(
    path: string,
    body: TEndpoint['body'],
    validation: { inputSchema?: JSONSchema; outputSchema: JSONSchema; endpoint: string },
    options: { method: 'GET' | 'POST' },
    auth: { type: 'none' | 'user2' | 'apikey-iot' | 'apikey' }
): Promise<TEndpoint['output']>
```

### 2. API key auth

Move `apiKey` out of per-call method signatures into `APIClientConfig`:

```typescript
export interface APIClientConfig {
    baseURL: string;
    credentials?: RequestCredentials;
    apiKey?: string;
    onError?: (error: Error, endpoint: string) => void;
}
```

`fetch` reads `this.apiKey` and adds the `Authorization: Bearer` header automatically when `auth.type` is `apikey` or `apikey-iot`.

### 3. Content-Type and JSON serialization

`fetch` handles `JSON.stringify(body)` and sets `Content-Type: application/json` internally when body is non-null. Callers never do this.

### 4. Generic endpoint type

Define `Endpoint<TOutput, TBody = null>` in the SDK boilerplate. Generate per-endpoint bundle types alongside the existing individual types:

```typescript
interface Endpoint<TOutput, TBody = null> {
    output: TOutput;
    body: TBody;
}

// Generated (POST):
export type HomeTracker_Upload = Endpoint<HomeTracker_Upload_Output, HomeTracker_Upload_Input>;
// Generated (GET):
export type Chords_GetAll = Endpoint<Chords_GetAll_Output>; // body defaults to null
```

### 5. Schema types

Use `JSONSchema` from `json-schema-to-ts` for `validation.inputSchema` and `validation.outputSchema`. Already available in both back and front packages.

## Generated Endpoint Shape

```typescript
// POST with apikey-iot auth:
upload: async (body: HomeTracker_Upload['body']) =>
    this.fetch<HomeTracker_Upload>(
        '/homeTracker/upload', body,
        { inputSchema: schemas.homeTracker_upload_Input, outputSchema: schemas.homeTracker_upload_Output, endpoint: 'homeTracker.upload' },
        { method: 'POST' },
        { type: 'apikey-iot' }
    ),

// GET, no auth:
getAll: async () =>
    this.fetch<Chords_GetAll>(
        '/chords/getAll', null,
        { outputSchema: schemas.chords_getAll_Output, endpoint: 'chords.getAll' },
        { method: 'GET' },
        { type: 'none' }
    ),
```

## What Still Needs Designing

- Full spec + implementation plan (route.njk template changes, generateSDK.ts changes, sdk.njk changes)
- Verify the design covers path param routes (e.g. `/r/:linkId`)
- Verify existing frontend callers are not broken
