import { db } from '../../databases/db.js';
import { handleDuplicateEntry } from '../../errors/dbHelpers.js';

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
