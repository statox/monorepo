import { DeleteObjectCommand, HeadObjectCommand, S3ServiceException } from '@aws-sdk/client-s3';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { getPresignedGetUrl, getPresignedPutUrl, S3 } from '../../databases/s3.js';
import { db } from '../../databases/db.js';
import {
    ExpiredItemError,
    ItemNotFoundError,
    TooManyEntriesError,
    UploadNotFoundError
} from './errors.js';
import { slog } from '../logging/index.js';
import slug from 'slug';
import { generate4BytesHex } from '../random.js';

export type ManagedBuckets = 'clipboard' | 'reactor';

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

// Inserts a pending S3Files row (uploadedDateUnix = NULL) and returns a presigned PUT URL.
// The client uploads to that URL, then confirmS3FileUpload() marks the row uploaded.
export const prepareS3FileInTransaction = async (
    conn: PoolConnection,
    params: {
        bucket: ManagedBuckets;
        s3Key: string;
        contentType: string;
        sizeBytes: number;
    }
) => {
    const { bucket, s3Key, contentType, sizeBytes } = params;

    await conn.query(
        `INSERT INTO S3Files (bucket, s3Key, creationDateUnix, uploadedDateUnix) VALUES (?, ?, UNIX_TIMESTAMP(), NULL)`,
        [bucket, s3Key]
    );

    return getPresignedPutUrl({
        bucket,
        key: s3Key,
        contentType,
        contentLength: sizeBytes
    });
};

// Checks the object really is in the bucket before marking the row uploaded.
// Size and content type are not compared: they are pinned by the presigned URL signature.
export const confirmS3FileUpload = async (params: { bucket: ManagedBuckets; s3Key: string }) => {
    const { bucket, s3Key } = params;

    try {
        await S3.send(new HeadObjectCommand({ Bucket: bucket, Key: s3Key }));
    } catch (error) {
        if ((error as S3ServiceException).$metadata?.httpStatusCode === 404) {
            slog.log('s3Files', 'Upload to confirm is not in the bucket', { bucket, s3Key });
            throw new UploadNotFoundError();
        }
        throw error;
    }

    await db.query(
        'UPDATE S3Files SET uploadedDateUnix = UNIX_TIMESTAMP() WHERE bucket = ? AND s3Key = ? AND uploadedDateUnix IS NULL',
        [bucket, s3Key]
    );
};

// Removes a never-confirmed upload. DeleteObject succeeds even if nothing was uploaded.
// The row is hard-deleted: the file never existed from the app's point of view,
// deletionDateUnix keeps meaning "was live, then deleted".
export const deleteAbandonedS3FileInTransaction = async (
    conn: PoolConnection,
    params: { bucket: ManagedBuckets; s3Key: string }
) => {
    const { bucket, s3Key } = params;
    await S3.send(new DeleteObjectCommand({ Bucket: bucket, Key: s3Key }));
    await conn.query(
        'DELETE FROM S3Files WHERE bucket = ? AND s3Key = ? AND uploadedDateUnix IS NULL',
        [bucket, s3Key]
    );
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
    uploadedDateUnix: number | null;
}
export const getPresignedURLForKey = async (params: { bucket: ManagedBuckets; s3Key: string }) => {
    const { bucket, s3Key } = params;
    const [rows] = await db.query<s3FileResult[]>(
        'SELECT s3Key, deletionDateUnix, uploadedDateUnix FROM S3Files WHERE s3Key = ? AND bucket = ?',
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
    // Pending: prepared but never confirmed as present in the bucket
    if (rows[0].uploadedDateUnix === null) {
        throw new ItemNotFoundError();
    }

    return getPresignedGetUrl({ bucket, key: s3Key });
};
