import { db } from '../../../databases/db.js';

interface RecordEventParams {
    clientTimestampUnix: number;
    app: string;
    path: string;
    action: string;
    clientId: string;
}

export const recordEvent = async (params: RecordEventParams) => {
    await db.query(
        `INSERT INTO WebStats (clientTimestampUnix, app, path, action, clientId, createdAtUnix)
         VALUES (?, ?, ?, ?, ?, UNIX_TIMESTAMP())`,
        [params.clientTimestampUnix, params.app, params.path, params.action, params.clientId]
    );
};
