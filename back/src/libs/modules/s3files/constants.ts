// Pending uploads older than this are deleted by cleanupAbandonedUploads().
// Well above the 15 min presigned URL expiry.
export const ABANDONED_UPLOAD_AGE_SEC = 3600;
