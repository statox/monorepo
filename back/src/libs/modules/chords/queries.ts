import { OkPacket, RowDataPacket } from 'mysql2';
import { Chord } from './types.js';
import { db } from '../../databases/db.js';
import { ChordNotFoundError } from './errors.js';

type ChordRow = {
    id: number;
    artist: string;
    title: string;
    url: string;
    tags: string;
    creationDateUnix: number;
    visitsCount: number;
    lastAccessDateUnix: number | null;
};

export const getAllChords = async (): Promise<Chord[]> => {
    const [rows] = await db.query<RowDataPacket[]>(
        'SELECT id, artist, title, url, tags, creationDateUnix, visitsCount, lastAccessDateUnix FROM Chord'
    );

    return (rows as ChordRow[]).map((row) => ({
        ...row,
        tags: JSON.parse(row.tags)
    }));
};

export const addLinkVisit = async (params: { url: string }) => {
    const [result] = await db.execute(
        `UPDATE Chord SET visitsCount = visitsCount + 1, lastAccessDateUnix = UNIX_TIMESTAMP() WHERE url = ?`,
        [params.url]
    );

    if ((result as OkPacket).affectedRows === 0) {
        throw new ChordNotFoundError();
    }
};
