export const REACTOR_ALLOWED_MIMES = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp'
] as const;
export type ReactorMime = (typeof REACTOR_ALLOWED_MIMES)[number];

export const REACTOR_MAX_SIZE_BYTES = 10 * 1024 * 1024;

// Pending uploads older than this are deleted by cleanupAbandonedUploads().
// Well above the 15 min presigned URL expiry.
export const ABANDONED_UPLOAD_AGE_SEC = 3600;
