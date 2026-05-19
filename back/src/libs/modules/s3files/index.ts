import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { getPresignedUrl, S3 } from '../../databases/s3.js';
import { db } from '../../databases/db.js';
import { ExpiredItemError, ItemNotFoundError, TooManyEntriesError } from './errors.js';
import { slog } from '../logging/index.js';
import slug from 'slug';
import { generate4BytesHex } from '../random.js';
import { ApiFile } from '../../routes/index.js';

type ManagedBuckets = 'clipboard' | 'reactor';

export const createS3Key = (params: {
    filename: string;
    extension?: string;
}): { linkId: string; s3Key: string } => {
    const { filename, extension } = params;

    // 4 bytes = ~4 billion possibilities. For a personal tool the probability is negligible.
    const linkId = generate4BytesHex();
    const cleanName = slug(filename);

    let s3Key = `${linkId}_${cleanName}`;
    if (extension) {
        s3Key += `.${extension}`;
    }

    return { linkId, s3Key };
};

export const createS3FileInTransaction = async (
    conn: PoolConnection, //TODO probably a better way to get just a transaction
    params: {
        file: ApiFile;
        bucket: ManagedBuckets;
        s3Key: string;
    }
) => {
    const { file, bucket, s3Key } = params;

    // Read the file into a buffer before the try/finally so the temp file can
    // be safely deleted in finally without racing against a lazy ReadStream open.
    const fileBuffer = await fs.promises.readFile(file.path);

    try {
        await S3.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: s3Key,
                Body: fileBuffer,
                ContentType: file.mimetype ?? undefined
            })
        );
        await conn.query(
            `INSERT INTO S3Files (bucket, s3Key, creationDateUnix) VALUES (?, ?, UNIX_TIMESTAMP())`,
            [bucket, s3Key]
        );
    } finally {
        await fs.promises.unlink(file.path).catch((err: Error) => {
            slog.log('s3Files', 'Failed to delete temp file', { error: err });
        });
    }
};

// TODO: Decide if we want to use a transaction or not
export const deleteS3File = async (params: { bucket: ManagedBuckets; s3Key: string }) => {
    const { bucket, s3Key } = params;
    await S3.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: s3Key
        })
    );
    await db.query(
        'UPDATE S3Files SET deletionDateUnix = UNIX_TIMESTAMP() WHERE s3Key = ? AND bucket = ?',
        [s3Key, bucket]
    );
};

interface s3FileResult extends RowDataPacket {
    s3Key: string;
    deletionDateUnix?: number;
}
export const getPresignedURLForKey = async (params: { bucket: ManagedBuckets; s3Key: string }) => {
    const { bucket, s3Key } = params;
    const [rows] = await db.query<s3FileResult[]>(
        'SELECT s3Key, deletionDateUnix FROM S3Files WHERE s3Key = ? AND bucket = ?',
        [s3Key, bucket]
    );

    if (!rows.length) {
        throw new ItemNotFoundError();
    }
    if (rows.length > 1) {
        slog.log('s3Files', 'multiple entries with same s3Key', { s3Key, bucket });
        throw new TooManyEntriesError();
    }
    if (rows[0].deletionDateUnix) {
        throw new ExpiredItemError();
    }

    return getPresignedUrl({ bucket, key: s3Key });
};
