import { RowDataPacket } from 'mysql2/promise';
import { db } from '../../databases/db.js';
import { slog } from '../logging/index.js';
import { confirmS3FileUpload } from '../s3files/index.js';
import { ItemNotFoundError } from '../s3files/errors.js';

interface s3KeyResult extends RowDataPacket {
    s3Key: string;
}

export const confirmEntryUpload = async (linkId: string) => {
    const [rows] = await db.query<s3KeyResult[]>('SELECT s3Key FROM Reactor WHERE linkId = ?', [
        linkId
    ]);
    if (!rows.length) {
        slog.log('reactor', 'entry not found', { linkId });
        throw new ItemNotFoundError();
    }

    await confirmS3FileUpload({ bucket: 'reactor', s3Key: rows[0].s3Key });
};
