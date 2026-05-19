import mime from 'mime-types';
import { generate4BytesHex } from '../random.js';
import { db } from '../../databases/db.js';
import { createS3FileInTransaction, createS3Key } from '../s3files/index.js';
import { handleDuplicateEntry } from '../../errors/dbHelpers.js';
import { ApiFile } from '../../routes/index.js';

type NewEntryParams = {
    name: string;
    content?: string;
    ttlSeconds?: number;
    isPublic?: boolean;
    file?: ApiFile;
};

export const addEntry = async (newEntry: NewEntryParams) => {
    const DEFAULT_TTL = 60 * 5; // 5 MINUTES
    const { name, content, ttlSeconds = DEFAULT_TTL, isPublic = false, file } = newEntry;

    let linkId: string;
    let s3Key: string | undefined;

    if (file) {
        const mimeExtension = mime.extension(file.mimetype ?? '') || undefined;
        ({ linkId, s3Key } = createS3Key({ filename: name, extension: mimeExtension }));
    } else {
        linkId = generate4BytesHex();
        s3Key = undefined;
    }

    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
        await conn.query(
            `
INSERT INTO Clipboard (name, content, ttl, isPublic, linkId, s3Key, creationDateUnix)
VALUES (?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP())
`,
            [name, content, ttlSeconds, isPublic, linkId, s3Key]
        );

        if (file && s3Key) {
            await createS3FileInTransaction(conn, { file, bucket: 'clipboard', s3Key });
        }

        return conn.commit();
    } catch (error) {
        await conn.rollback();
        handleDuplicateEntry(error, 'ITEM_ALREADY_EXISTS');
    } finally {
        conn.release();
    }
};
