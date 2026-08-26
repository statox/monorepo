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
    contentB64: string | null;
    creationDateUnix: number;
    visitsCount: number;
    lastAccessDateUnix: number | null;
};

export const getAllChords = async (): Promise<Chord[]> => {
    const [rows] = await db.query<RowDataPacket[]>(
        'SELECT id, artist, title, url, tags, contentB64, creationDateUnix, visitsCount, lastAccessDateUnix FROM Chord'
    );

    return (rows as ChordRow[]).map((row) => ({
        ...row,
        tags: JSON.parse(row.tags)
    }));
};

export const getChordById = async (chordId: number): Promise<Chord> => {
    const [rows] = await db.query<RowDataPacket[]>(
        `SELECT
            id,
            artist,
            title,
            url,
            tags,
            contentB64,
            creationDateUnix,
            visitsCount,
            lastAccessDateUnix
            FROM Chord
            WHERE id = ?`,
        [chordId]
    );

    if (rows.length === 0) {
        throw new ChordNotFoundError();
    }

    const row = rows[0] as ChordRow;
    return { ...row, tags: JSON.parse(row.tags) };
};

export const addLinkVisit = async (params: { id: number }) => {
    const [result] = await db.execute(
        `UPDATE Chord SET visitsCount = visitsCount + 1, lastAccessDateUnix = UNIX_TIMESTAMP() WHERE id = ?`,
        [params.id]
    );

    if ((result as OkPacket).affectedRows === 0) {
        throw new ChordNotFoundError();
    }
};
