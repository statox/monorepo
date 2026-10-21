import { DateTime, type DurationUnit } from 'luxon';
import type { ClipboardEntryEnriched, ExpirationStatus } from './types';
import { client2, putFileToPresignedUrl } from '$lib/api';

const enrichEntry = (entry: {
    id: number;
    name: string;
    content: string;
    creationDateUnix: number;
    ttl: number;
    isPublic: boolean;
    linkId: string;
    s3Key?: string;
    s3PresignedUrl?: string;
}): ClipboardEntryEnriched => {
    const now = DateTime.now();
    const formatedCreationDate =
        DateTime.fromSeconds(entry.creationDateUnix).toRelative({
            style: 'short'
        }) || 'N/A';

    const expirationTs = entry.creationDateUnix + entry.ttl;
    const expirationDate = DateTime.fromSeconds(expirationTs);
    const expirationInSeconds = expirationDate.diffNow('seconds').get('seconds');
    const expirationDuration = expirationDate.diff(now).rescale();
    const keptUnits: DurationUnit[] = [];
    if (expirationDuration.years > 0) {
        keptUnits.push('years');
        keptUnits.push('months');
    } else if (expirationDuration.months > 0) {
        keptUnits.push('months');
    } else if (expirationDuration.days > 0) {
        keptUnits.push('days');
    } else if (expirationDuration.hours > 0) {
        keptUnits.push('hours');
        keptUnits.push('minutes');
    } else if (expirationDuration.minutes) {
        keptUnits.push('minutes');
    } else {
        keptUnits.push('seconds');
    }

    const formatedExpirationDate = expirationDuration
        .shiftTo(...keptUnits)
        .mapUnits((x) => Math.ceil(x))
        .toHuman();

    let expirationStatus: ExpirationStatus = 'not_soon';
    if (expirationDate < now) {
        expirationStatus = 'expired';
    } else if (expirationInSeconds < 60 * 60) {
        // 1 hour
        expirationStatus = 'very_soon';
    } else if (expirationInSeconds < 60 * 60 * 24) {
        // 1 day
        expirationStatus = 'soon';
    }

    return {
        ...entry,
        formatedCreationDate,
        formatedExpirationDate,
        expirationStatus
    };
};

export const getPublicClipboard = async () => {
    const entries = await client2.clipboard.getPublicEntries();
    return entries.map((entry) => enrichEntry(entry));
};

export const getAllClipboard = async () => {
    const entries = await client2.clipboard.getAllEntries();
    return entries.map((entry) => enrichEntry(entry));
};

// Must match the backend limit in back/src/libs/modules/clipboard/constants.ts
export const CLIPBOARD_MAX_SIZE_BYTES = 5 * 1024 * 1024;

type ClipboardEntryInput = {
    name: string;
    content: string;
    ttlSeconds: number;
    isPublic: boolean;
};

// Text entries are a single call. Entries with a file work like Reactor uploads:
// 1. the API reserves the entry and signs an upload URL
// 2. the browser uploads the file straight to the bucket
// 3. the API checks the file is there and lists the entry
export const uploadToClipboard = async (input: ClipboardEntryInput, file: File | null) => {
    if (!file) {
        return client2.clipboard.addEntry(input);
    }

    // The browser reports an empty type for unknown files
    const mimetype = file.type || 'application/octet-stream';
    const { linkId, uploadUrl } = await client2.clipboard.prepareUpload({
        ...input,
        mimetype,
        sizeBytes: file.size
    });

    await putFileToPresignedUrl({
        uploadUrl,
        file,
        contentType: mimetype,
        failureHint: `The name "${input.name}" stays reserved for up to 2 hours: retry later or use another name.`
    });

    await client2.clipboard.confirmUpload({ linkId });
};
export const deleteClipboardEntry = client2.clipboard.deleteEntry;
