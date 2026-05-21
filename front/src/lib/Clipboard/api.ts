import { DateTime, type DurationUnit } from 'luxon';
import type { ClipboardEntryEnriched, ExpirationStatus } from './types';
import { client2 } from '$lib/api';

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

export const uploadToClipboard = client2.clipboard.addEntry;
export const deleteClipboardEntry = client2.clipboard.deleteEntry;
