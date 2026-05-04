import { File } from 'formidable';
import mime from 'mime-types';
import { generate4BytesHex } from '../random.js';
import { db } from '../../databases/db.js';
import { handleDuplicateEntry } from '../../errors/dbHelpers.js';
import { createS3FileInTransaction } from '../s3files/index.js';

type NewEntryParams = {
    name: string;
    tags: string[];
    file: File;
};

export const addEntry = async (newEntry: NewEntryParams) => {
    const { name, tags, file } = newEntry;

    const linkId = generate4BytesHex();
    const extension = mime.extension(file.mimetype ?? '');

    let s3Key = `${linkId}_${name}`;
    if (extension) {
        s3Key += `.${extension}`;
    }

    const conn = await db.getConnection();
    conn.beginTransaction();
    try {
        await conn.query(
            `INSERT INTO Reactor (name, tags, linkId, s3Key, creationDateUnix) VALUES (?, ?, ?, ?, UNIX_TIMESTAMP())`,
            [name, JSON.stringify(tags), linkId, s3Key]
        );

        await createS3FileInTransaction(conn, { file, bucket: 'reactor', s3Key });
        return conn.commit();
    } catch (error) {
        await conn.rollback();
        handleDuplicateEntry(error, 'ITEM_ALREADY_EXISTS');
    } finally {
        conn.release();
    }
};
