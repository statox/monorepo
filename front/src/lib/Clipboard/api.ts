import { DateTime, type DurationUnit } from 'luxon';
import { getApiUrl } from '$lib/helpers';
import type { ClipboardEntryEnriched, ExpirationStatus } from './types';
import superagent from 'superagent';
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

export const uploadToClipboard = async (data: {
    name: string;
    content: string;
    file?: File;
    ttlSeconds: number;
    isPublic: boolean;
}) => {
    const url = getApiUrl() + '/clipboard/addEntry';

    if (data.file) {
        const request = superagent.post(url).withCredentials();

        if (data.name !== undefined) request.field('name', data.name);
        if (data.content !== undefined) request.field('content', data.content);
        if (data.ttlSeconds !== undefined) request.field('ttlSeconds', data.ttlSeconds);
        if (data.isPublic !== undefined) request.field('isPublic', data.isPublic);

        // TODO have the SDK provide a handler for form content requests
        // @ts-expect-error We need to fix the typing of File in the SDK
        await request.attach('file', data.file);
        return;
    }

    // @ts-expect-error We need to fix the typing of File in the SDK
    return client2.clipboard.addEntry(data);
};

export const deleteClipboardEntry = client2.clipboard.deleteEntry;
