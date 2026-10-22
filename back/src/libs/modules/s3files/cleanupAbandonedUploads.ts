import { RowDataPacket } from 'mysql2/promise';
import { db } from '../../databases/db.js';
import { slog } from '../logging/index.js';
import { AppLogComponent } from '../logging/types.js';
import { pushNotifier } from '../notifier/index.js';
import { ABANDONED_UPLOAD_AGE_SEC } from './constants.js';
import { deleteAbandonedS3FileInTransaction, ManagedBuckets } from './index.js';

interface AbandonedEntry extends RowDataPacket {
    id: number;
    name: string;
    s3Key: string;
}

type CleanupParams = {
    bucket: ManagedBuckets;
    // Interpolated in the SQL: must be a fixed value, never user input
    table: 'Reactor' | 'Clipboard';
    logComponent: AppLogComponent;
    notificationTitle: string;
};

// Deletes entries of `table` prepared with a presigned upload but never confirmed,
// freeing their name and linkId.
export const cleanupAbandonedUploads = async (params: CleanupParams) => {
    const { bucket, table, logComponent, notificationTitle } = params;

    const [entries] = await db.query<AbandonedEntry[]>(
        `SELECT e.id, e.name, e.s3Key
        FROM ${table} e
        JOIN S3Files s ON s.bucket = ? AND s.s3Key = e.s3Key
        WHERE s.uploadedDateUnix IS NULL
        AND s.creationDateUnix < UNIX_TIMESTAMP() - ?`,
        [bucket, ABANDONED_UPLOAD_AGE_SEC]
    );

    for (const entry of entries) {
        const conn = await db.getConnection();
        await conn.beginTransaction();
        try {
            // S3 first: if it fails the rows stay and the next run retries
            await deleteAbandonedS3FileInTransaction(conn, { bucket, s3Key: entry.s3Key });
            await conn.query(`DELETE FROM ${table} WHERE id = ?`, [entry.id]);
            await conn.commit();
            slog.log(logComponent, 'Deleted abandoned upload', {
                entryName: entry.name,
                s3Key: entry.s3Key
            });
        } catch (error) {
            await conn.rollback();
            slog.log(logComponent, 'Failed to delete abandoned upload', {
                entryName: entry.name,
                s3Key: entry.s3Key,
                error: error as Error
            });
            await pushNotifier.notify({
                title: notificationTitle,
                message: `Failed to clean up abandoned upload "${entry.name}" (${entry.s3Key})`
            });
        } finally {
            conn.release();
        }
    }
};
