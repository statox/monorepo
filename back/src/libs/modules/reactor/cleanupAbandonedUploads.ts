import { RowDataPacket } from 'mysql2/promise';
import { db } from '../../databases/db.js';
import { slog } from '../logging/index.js';
import { pushNotifier } from '../notifier/index.js';
import { deleteAbandonedS3FileInTransaction } from '../s3files/index.js';
import { ABANDONED_UPLOAD_AGE_SEC } from './constants.js';

interface AbandonedEntry extends RowDataPacket {
    id: number;
    name: string;
    s3Key: string;
}

// Deletes entries prepared with prepareEntryUpload() but never confirmed,
// freeing their name and linkId.
export const cleanupAbandonedUploads = async () => {
    const [entries] = await db.query<AbandonedEntry[]>(
        `SELECT r.id, r.name, r.s3Key
        FROM Reactor r
        JOIN S3Files s ON s.bucket = 'reactor' AND s.s3Key = r.s3Key
        WHERE s.uploadedDateUnix IS NULL
        AND s.creationDateUnix < UNIX_TIMESTAMP() - ?`,
        [ABANDONED_UPLOAD_AGE_SEC]
    );

    for (const entry of entries) {
        const conn = await db.getConnection();
        await conn.beginTransaction();
        try {
            // S3 first: if it fails the rows stay and the next run retries
            await deleteAbandonedS3FileInTransaction(conn, {
                bucket: 'reactor',
                s3Key: entry.s3Key
            });
            await conn.query('DELETE FROM Reactor WHERE id = ?', [entry.id]);
            await conn.commit();
            slog.log('reactor', 'Deleted abandoned upload', {
                entryName: entry.name,
                s3Key: entry.s3Key
            });
        } catch (error) {
            await conn.rollback();
            slog.log('reactor', 'Failed to delete abandoned upload', {
                entryName: entry.name,
                s3Key: entry.s3Key,
                error: error as Error
            });
            await pushNotifier.notify({
                title: 'Reactor',
                message: `Failed to clean up abandoned upload "${entry.name}" (${entry.s3Key})`
            });
        } finally {
            conn.release();
        }
    }
};
