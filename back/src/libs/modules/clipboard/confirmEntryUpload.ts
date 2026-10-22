import { RowDataPacket } from 'mysql2/promise';
import { db } from '../../databases/db.js';
import { slog } from '../logging/index.js';
import { confirmS3FileUpload } from '../s3files/index.js';
import { ItemNotFoundError } from '../s3files/errors.js';

interface s3KeyResult extends RowDataPacket {
    s3Key: string | null;
}

export const confirmEntryUpload = async (linkId: string) => {
    const [rows] = await db.query<s3KeyResult[]>('SELECT s3Key FROM Clipboard WHERE linkId = ?', [
        linkId
    ]);
    // A text entry has no file to confirm
    if (!rows.length || !rows[0].s3Key) {
        slog.log('clipboard', 'entry with file not found', { linkId });
        throw new ItemNotFoundError();
    }

    await confirmS3FileUpload({ bucket: 'clipboard', s3Key: rows[0].s3Key });
};
