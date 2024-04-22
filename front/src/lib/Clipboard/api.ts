import { DateTime } from 'luxon';
import { PUBLIC_API_URL } from '$env/static/public';
import { getAccessToken } from '$lib/auth/service';
import type {
    ClipboardEntry,
    ClipboardEntryEnriched,
    ClipboardUploadData,
    ExpirationStatus
} from './types';
import superagent from 'superagent';
import { requestAPIGet, requestAPIPost } from '$lib/api';

const enrichEntry = (entry: ClipboardEntry): ClipboardEntryEnriched => {
    const now = DateTime.now();
    const formatedCreationDate = DateTime.fromSeconds(entry.creationDateUnix).toRelative({
        style: 'short'
    });

    const expirationTs = entry.creationDateUnix + entry.ttl;
    const expirationDate = DateTime.fromSeconds(expirationTs);
    const expirationInSeconds = expirationDate.diffNow('seconds').get('seconds');

    const formatedExpirationDate = expirationDate.toRelative({
        style: 'short'
    });

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
    const entries = await requestAPIGet<ClipboardEntry[]>({ path: '/clipboard/getPublicEntries' });
    return entries.map((entry) => enrichEntry(entry));
};

export const getAllClipboard = async () => {
    const entries = await requestAPIGet<ClipboardEntry[]>({
        authorize: true,
        path: '/clipboard/getAllEntries'
    });
    return entries.map((entry) => enrichEntry(entry));
};

export const uploadToClipboard = async (data: ClipboardUploadData) => {
    const url = PUBLIC_API_URL + '/clipboard/addEntry';
    const token = await getAccessToken();

    // TODO Fix return type of getAccessToken()
    if (typeof token !== 'string') {
        return;
    }

    if (data.file) {
        await superagent
            .post(url)
            .auth(token, { type: 'bearer' })
            .field('name', data.name)
            .field('content', data.content)
            .field('ttlSeconds', data.ttlSeconds)
            .field('isPublic', data.isPublic)
            // @ts-expect-error TODO: Fix types
            .attach('file', data.file);
        return;
    }

    return requestAPIPost<void>({ path: '/clipboard/addEntry', data });
};

export const deleteClipboardEntry = (name: string) => {
    return requestAPIPost<void>({ path: '/clipboard/deleteEntry', data: { name } });
};
