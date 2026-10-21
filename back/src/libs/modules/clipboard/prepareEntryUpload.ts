import mime from 'mime-types';
import { db } from '../../databases/db.js';
import { handleDuplicateEntry } from '../../errors/dbHelpers.js';
import { createS3Key, prepareS3FileInTransaction } from '../s3files/index.js';
import { CLIPBOARD_DEFAULT_TTL_SECONDS } from './constants.js';

type PrepareEntryUploadParams = {
    name: string;
    mimetype: string;
    sizeBytes: number;
    content?: string;
    ttlSeconds?: number;
    isPublic?: boolean;
};

export const prepareEntryUpload = async (params: PrepareEntryUploadParams) => {
    const {
        name,
        mimetype,
        sizeBytes,
        // The listing routes require a string: never store NULL
        content = '',
        ttlSeconds = CLIPBOARD_DEFAULT_TTL_SECONDS,
        isPublic = false
    } = params;

    const extension = mime.extension(mimetype) || undefined;
    const { linkId, s3Key } = createS3Key({ filename: name, extension });

    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
        await conn.query(
            `INSERT INTO Clipboard (name, content, ttl, isPublic, linkId, s3Key, creationDateUnix)
VALUES (?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP())`,
            [name, content, ttlSeconds, isPublic, linkId, s3Key]
        );

        const uploadUrl = await prepareS3FileInTransaction(conn, {
            bucket: 'clipboard',
            s3Key,
            contentType: mimetype,
            sizeBytes
        });
        await conn.commit();
        return { linkId, uploadUrl };
    } catch (error) {
        await conn.rollback();
        handleDuplicateEntry(error, 'ITEM_ALREADY_EXISTS');
    } finally {
        conn.release();
    }
};
