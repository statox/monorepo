import mime from 'mime-types';
import { db } from '../../databases/db.js';
import { handleDuplicateEntry } from '../../errors/dbHelpers.js';
import { createS3Key, prepareS3FileInTransaction } from '../s3files/index.js';
import { ReactorMime } from './constants.js';

type PrepareEntryUploadParams = {
    name: string;
    tags: string[];
    mimetype: ReactorMime;
    sizeBytes: number;
};

export const prepareEntryUpload = async (params: PrepareEntryUploadParams) => {
    const { name, tags, mimetype, sizeBytes } = params;

    const extension = mime.extension(mimetype) || undefined;
    const { linkId, s3Key } = createS3Key({ filename: name, extension });

    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
        await conn.query(
            `INSERT INTO Reactor (name, tags, linkId, s3Key, creationDateUnix) VALUES (?, ?, ?, ?, UNIX_TIMESTAMP())`,
            [name, JSON.stringify(tags), linkId, s3Key]
        );

        const uploadUrl = await prepareS3FileInTransaction(conn, {
            bucket: 'reactor',
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
