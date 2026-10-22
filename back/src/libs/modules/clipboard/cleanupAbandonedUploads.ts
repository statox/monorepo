import { cleanupAbandonedUploads as cleanupAbandonedS3Uploads } from '../s3files/cleanupAbandonedUploads.js';

export const cleanupAbandonedUploads = () =>
    cleanupAbandonedS3Uploads({
        bucket: 'clipboard',
        table: 'Clipboard',
        logComponent: 'clipboard',
        notificationTitle: 'Clipboard'
    });
