# API Client SDK Generator

This script automatically generates a fully-typed TypeScript SDK for the api.statox.fr backend API.

## Features

- **Fully Type-Safe**: All endpoints have complete TypeScript types derived from JSON schemas
- **Runtime Validation**: Input validation using AJV before sending requests
- **Grouped by Module**: Methods organized by feature module (e.g., `client.homeTracker.getDashboard()`)
- **Typed Error Codes**: Each endpoint exports an `_Errors` union type listing every error code it can return
- **Automatic Credentials**: Session cookies sent only for `user2` endpoints; `omit` elsewhere
- **Error Handling**: Configurable error handler for all requests

## Usage

### 1. Generate the SDK

```bash
npx tsx scripts/generateSDK.ts ../front/src/vendor/statox-api
```

**Example:** Generate SDK to SvelteKit frontend (We have a dedicated npm script with the right path)

```bash
npm run generate:sdk
```

This creates `vendor/statox-api/index.ts` in the specified directory.

### 2. Install Dependencies in Your Frontend

The generated SDK requires these dependencies:

```bash
npm install ajv json-schema-to-ts
```

### 3. Initialize the Client

```typescript
// src/lib/api/client.ts
import { APIClient } from '$vendor/statox-api';

// Session-based client (user2 endpoints)
export const client = new APIClient({
    baseURL: getApiUrl(),
    onError: (error, endpoint) => {
        console.error(`API Error on ${endpoint}:`, error.code, error.httpStatus);
    }
});

// API key client (apikey / apikey-iot endpoints)
export const iotClient = new APIClient({
    baseURL: getApiUrl(),
    apiKey: MY_API_KEY
});
```

Credentials are managed automatically:
- `user2` endpoints send `credentials: 'include'` (session cookie)
- All other endpoints send `credentials: 'omit'`

### 4. Use the Client

```typescript
import { client } from '$lib/api/client';

// Authentication
await client.auth.login({ username: 'user', password: 'pass' });
const { status, user } = await client.auth.me();
await client.auth.logout();

// HomeTracker
const dashboard = await client.homeTracker.getSensorsDataForDashboard();
const histogram = await client.homeTracker.histogramData({ timeWindow: '7d' });

// Chords
const allChords = await client.chords.getAll();
await client.chords.addLinkVisit({ url: 'https://example.com' });

// With path parameters
const entry = await client.misc.r({ linkId: 'abc123' });
```

## Generated SDK Structure

```typescript
export class APIClient {
    constructor(config: APIClientConfig);

    auth = {
        login: (input) => Promise<Output>,
        logout: (input) => Promise<Output>,
        me: (input) => Promise<Output>
    };

    homeTracker = {
        getDashboard: () => Promise<Output>,
        histogramData: (input) => Promise<Output>,
        upload: (input) => Promise<Output>
        // ... more methods
    };

    // ... more modules
}
```

## Type Exports

### Input / Output types

```typescript
import type {
    Auth_Login_Input,
    Auth_Login_Output,
    HomeTracker_HistogramData_Input,
    HomeTracker_HistogramData_Output
} from '$vendor/statox-api';
```

### Error union types

Every endpoint exports an `_Errors` type — a union of all error codes that endpoint can return.
It includes the endpoint's own business errors, the auth errors for its authentication type,
`INPUT_VALIDATION_FAILED` (POST routes only), `INTERNAL_SERVER_ERROR`, and `NETWORK_ERROR`.

```typescript
// Example generated types:
export type Chords_UpdateAll_Errors =
    | 'UNAUTHORIZED'
    | 'FORBIDDEN_FOR_USER'
    | 'INVALID_SCOPE'
    | 'INPUT_VALIDATION_FAILED'
    | 'INTERNAL_SERVER_ERROR'
    | 'NETWORK_ERROR';

export type Clipboard_AddEntry_Errors =
    | 'FILE_OR_CONTENT_REQUIRED'
    | 'ITEM_ALREADY_EXISTS'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN_FOR_USER'
    | 'INVALID_SCOPE'
    | 'INPUT_VALIDATION_FAILED'
    | 'INTERNAL_SERVER_ERROR'
    | 'NETWORK_ERROR';
```

## Error Handling

All errors thrown by the SDK are instances of `ApiError`:

```typescript
export class ApiError<TCode extends string = string> extends Error {
    readonly httpStatus: number; // HTTP status code (0 for network errors)
    readonly code: TCode;        // Machine-readable error code string
    readonly reason?: string;    // Optional human-readable detail
}
```

### Typed per-endpoint error handling

Use the `_Errors` type to get exhaustive type-checking over every code an endpoint can return:

```typescript
import { ApiError } from '$vendor/statox-api';
import type { Chords_UpdateAll_Errors } from '$vendor/statox-api';

try {
    await client.chords.updateAll({ chords });
} catch (error) {
    if (error instanceof ApiError) {
        const e = error as ApiError<Chords_UpdateAll_Errors>;
        if (e.code === 'UNAUTHORIZED') {
            errorMessage = 'Invalid logged in user';
        } else if (e.code === 'INVALID_SCOPE') {
            errorMessage = 'Invalid scope';
        } else if (e.code === 'FORBIDDEN_FOR_USER') {
            errorMessage = 'Forbidden for user';
        } else if (e.code === 'NETWORK_ERROR') {
            errorMessage = 'API unreachable';
        } else if (e.code === 'INTERNAL_SERVER_ERROR') {
            errorMessage = 'Server error';
        }
    }
}
```

### Global error handler

```typescript
const client = new APIClient({
    baseURL: getApiUrl(),
    onError: (error: ApiError, endpoint: string) => {
        if (error.code === 'UNAUTHORIZED') {
            goto('/login');
        }
        toast.push(`Error on ${endpoint}: ${error.code}`);
    }
});
```

The `onError` callback fires for every error before it is re-thrown, so per-request `catch` blocks
still receive the error.

## Validation

### Input Validation

All POST requests validate input against schemas before sending. An invalid payload throws
immediately without making a network request:

```typescript
await client.homeTracker.upload({
    sensorName: 'temp-sensor'
    // Missing required fields are caught before fetch is called
});
```

### Output Validation

Responses are validated against output schemas. Mismatches log a console warning but do not throw.

## Development Workflow

1. **Add/modify route** in the backend
2. **Compile TypeScript**: `npm run watch` or `npm run build`
3. **Regenerate SDK**: `npm run generate:sdk`
4. **Frontend gets updated types and methods**

## Technical Details

### How It Works

1. Script reads from compiled route registry (`dist/src/libs/routes/index.js`)
2. Extracts metadata: path, method, schemas, authentication, `clientErrors`
3. Groups routes by module (first path segment)
4. Generates TypeScript with:
    - Schema exports (for AJV validation)
    - Input/output type definitions (via `FromSchema<>`)
    - `_Errors` union type per endpoint (business errors + auth errors + globals)
    - `APIClient` class with fully typed methods

### Error code sources per endpoint

| Source | Included when |
|--------|--------------|
| Route `clientErrors` | Always |
| Auth errors (`UNAUTHORIZED`, `MISSING_API_KEY`, …) | Depends on `authentication` type |
| `INPUT_VALIDATION_FAILED` | POST routes with an input schema |
| `INTERNAL_SERVER_ERROR` | Always |
| `NETWORK_ERROR` | Always (fetch itself failed) |

### Bundle Impact

- Tree-shaking removes unused endpoints
- AJV validator instances are cached and reused
