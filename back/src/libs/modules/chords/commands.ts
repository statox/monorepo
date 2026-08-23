import { RowDataPacket } from 'mysql2';
import { db } from '../../databases/db.js';
import { handleDuplicateEntry } from '../../errors/dbHelpers.js';
import { ChordNotFoundError } from './errors.js';

export const addChord = async (params: {
    artist: string;
    title: string;
    url: string;
    tags: string[];
}) => {
    try {
        await db.query(
            `INSERT INTO Chord (artist, title, url, tags, creationDateUnix, visitsCount)
             VALUES (?, ?, ?, ?, UNIX_TIMESTAMP(), 0)`,
            [params.artist, params.title, params.url, JSON.stringify(params.tags)]
        );
    } catch (error) {
        handleDuplicateEntry(error, 'ITEM_ALREADY_EXISTS');
    }
};

export const deleteChord = async (id: number) => {
    await db.query(`DELETE FROM Chord WHERE id = ?`, [id]);
};

export const updateChord = async (params: {
    id: number;
    artist: string;
    title: string;
    url: string;
    tags: string[];
    contentB64?: string | null;
}) => {
    // Ensure the chord exists
    const [rows] = await db.query<RowDataPacket[]>('SELECT id FROM Chord WHERE id = ?', [
        params.id
    ]);

    if (rows.length === 0) {
        throw new ChordNotFoundError();
    }

    try {
        if (params.contentB64 !== undefined) {
            await db.query(
                `UPDATE Chord SET artist = ?, title = ?, url = ?, tags = ?, contentB64 = ? WHERE id = ?`,
                [
                    params.artist,
                    params.title,
                    params.url,
                    JSON.stringify(params.tags),
                    params.contentB64,
                    params.id
                ]
            );
        } else {
            await db.query(
                `UPDATE Chord SET artist = ?, title = ?, url = ?, tags = ? WHERE id = ?`,
                [params.artist, params.title, params.url, JSON.stringify(params.tags), params.id]
            );
        }
    } catch (error) {
        handleDuplicateEntry(error, 'ITEM_ALREADY_EXISTS');
    }
};
