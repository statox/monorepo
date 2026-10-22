import { cleanupAbandonedUploads as cleanupAbandonedS3Uploads } from '../s3files/cleanupAbandonedUploads.js';

export const cleanupAbandonedUploads = () =>
    cleanupAbandonedS3Uploads({
        bucket: 'reactor',
        table: 'Reactor',
        logComponent: 'reactor',
        notificationTitle: 'Reactor'
    });
