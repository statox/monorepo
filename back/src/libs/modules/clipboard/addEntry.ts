import { generate4BytesHex } from '../random.js';
import { db } from '../../databases/db.js';
import { handleDuplicateEntry } from '../../errors/dbHelpers.js';
import { CLIPBOARD_DEFAULT_TTL_SECONDS } from './constants.js';

type NewEntryParams = {
    name: string;
    content: string;
    ttlSeconds?: number;
    isPublic?: boolean;
};

// Adds a text entry. Entries with a file use prepareEntryUpload() and confirmEntryUpload()
export const addEntry = async (newEntry: NewEntryParams) => {
    const {
        name,
        content,
        ttlSeconds = CLIPBOARD_DEFAULT_TTL_SECONDS,
        isPublic = false
    } = newEntry;

    try {
        await db.query(
            `
INSERT INTO Clipboard (name, content, ttl, isPublic, linkId, creationDateUnix)
VALUES (?, ?, ?, ?, ?, UNIX_TIMESTAMP())
`,
            [name, content, ttlSeconds, isPublic, generate4BytesHex()]
        );
    } catch (error) {
        handleDuplicateEntry(error, 'ITEM_ALREADY_EXISTS');
    }
};
