// TODO: ErrorCode is currently a manually maintained list. Ideally it would be
// derived automatically from the AppError subclasses defined across the codebase,
// but that requires a registration pattern to avoid circular dependencies.
// For now, every new AppError subclass must add its code string here.
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
    // Ephemerides
    'RANGE_TOO_LARGE',
    'RANGE_IS_INVALID',
    // WebReader
    'INVALID_URL',
    // HomeTracker
    'SENSOR_NAME_DOES_NOT_EXISTS',
    // System (not forwarded to client)
    'OUTPUT_VALIDATION_FAILED',
    'INTERNAL_SERVER_ERROR',
    'INPUT_VALIDATION_FAILED'
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

// Auth and API key errors are always forwarded to the client regardless of route
// declarations — they come from infrastructure middleware that runs before route
// handlers, so individual routes cannot (and should not need to) whitelist them.
export const ALWAYS_CLIENT_ERRORS = new Set<ErrorCode>([
    'UNAUTHORIZED',
    'FORBIDDEN_FOR_USER',
    'INVALID_SCOPE',
    'MISSING_API_KEY',
    'INVALID_AUTH_HEADER',
    'UNKNOWN_API_KEY'
]);
