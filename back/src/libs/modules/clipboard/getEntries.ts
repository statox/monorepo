import { RowDataPacket } from 'mysql2';
import { db } from '../../databases/db.js';
import { getPresignedURLForKey } from '../s3files/index.js';

type ClipboardEntry = {
    id: number;
    name: string;
    content: string;
    creationDateUnix: number;
    ttl: number;
    isPublic: boolean;
    linkId: string;
    s3Key?: string;
    s3PresignedUrl?: string;
};

type ClipboardEntryDB = {
    id: number;
    name: string;
    content: string;
    creationDateUnix: number;
    ttl: number;
    isPublic: number;
    linkId: string;
    s3Key?: string;
    s3PresignedUrl?: string;
};

// Entries prepared with prepareEntryUpload() whose file isn't confirmed yet are not listed.
// An s3Key with no S3Files row is deliberately kept: enrichEntries() fails loudly on it.
const PENDING_UPLOADS_JOIN = `LEFT JOIN S3Files s ON s.bucket = 'clipboard' AND s.s3Key = c.s3Key`;
const NOT_PENDING_UPLOAD = `(c.s3Key IS NULL OR s.id IS NULL OR s.uploadedDateUnix IS NOT NULL)`;

export const getPublicEntries = async () => {
    const [entries] = await db.query<(ClipboardEntryDB & RowDataPacket)[]>(
        `SELECT
            c.id, c.name, c.content, c.creationDateUnix, c.ttl, c.isPublic, c.linkId, c.s3Key
        FROM Clipboard c
        ${PENDING_UPLOADS_JOIN}
        WHERE c.isPublic = 1
        AND c.creationDateUnix + c.ttl > UNIX_TIMESTAMP()
        AND ${NOT_PENDING_UPLOAD}
`
    );
    return await enrichEntries(entries);
};

export const getAllEntries = async () => {
    const [entries] = await db.query<(ClipboardEntryDB & RowDataPacket)[]>(
        `SELECT
            c.id, c.name, c.content, c.creationDateUnix, c.ttl, c.isPublic, c.linkId, c.s3Key
        FROM Clipboard c
        ${PENDING_UPLOADS_JOIN}
        WHERE ${NOT_PENDING_UPLOAD}`
    );
    return await enrichEntries(entries);
};

const enrichEntries = async (entries: ClipboardEntryDB[]) => {
    const enriched: ClipboardEntry[] = [];

    for (const entry of entries) {
        const enrichedEntry: ClipboardEntry = {
            id: entry.id,
            name: entry.name,
            content: entry.content,
            creationDateUnix: entry.creationDateUnix,
            ttl: entry.ttl,
            isPublic: Boolean(entry.isPublic),
            linkId: entry.linkId
        };
        if (entry.s3Key) {
            enrichedEntry.s3Key = entry.s3Key;
            enrichedEntry.s3PresignedUrl = await getPresignedURLForKey({
                bucket: 'clipboard',
                s3Key: entry.s3Key
            });
        }

        enriched.push(enrichedEntry);
    }

    return enriched;
};

type ClipboardEntryForStaticView = ClipboardEntry & {
    contentIsLink: boolean;
};

export const getEntriesForStaticView = async () => {
    const entries = await getPublicEntries();
    if (!entries) {
        return [];
    }

    const result: ClipboardEntryForStaticView[] = [];
    // Sort to have the newest entries at the top of the list
    for (const entry of entries.sort((a, b) => b.id - a.id)) {
        let contentIsLink: boolean;
        try {
            new URL(entry.content);
            contentIsLink = true;
        } catch (_e) {
            contentIsLink = false;
        }

        if (!entry.s3PresignedUrl && !contentIsLink) {
            continue;
        }
        result.push({ ...entry, contentIsLink });
    }
    return result;
};
