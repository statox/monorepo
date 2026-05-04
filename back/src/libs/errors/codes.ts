export const ERROR_CODES = [
    // Auth / session
    'UNAUTHORIZED',
    'FORBIDDEN_FOR_USER',
    'INVALID_SCOPE',
    // API Key
    'MISSING_API_KEY',
    'INVALID_AUTH_HEADER',
    'UNKNOWN_API_KEY',
    // Route-level business errors
    'ITEM_ALREADY_EXISTS',
    'ITEM_NOT_FOUND',
    'FILE_OR_CONTENT_REQUIRED',
    'ITEM_IS_EXPIRED',
    'TOO_MANY_ENTRIES',
    // Cookbook
    'DUPLICATE_INGREDIENT',
    'RECIPE_ID_NOT_FOUND',
    // Ephemerides
    'RANGE_TOO_LARGE',
    'RANGE_IS_INVALID',
    // WebReader
    'INVALID_URL',
    // HomeTracker
    'SENSOR_NAME_DOES_NOT_EXISTS',
    // WebWatcher
    'ENTRY_ALREADY_EXISTS',
    // System (not forwarded to client)
    'OUTPUT_VALIDATION_FAILED',
    'INTERNAL_SERVER_ERROR',
    'INPUT_VALIDATION_FAILED'
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];
