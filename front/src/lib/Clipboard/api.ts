import { DateTime } from 'luxon';
import { PUBLIC_API_URL } from '$env/static/public';
import { getAccessToken } from '$lib/auth/service';
import type {
    ClipboardEntry,
    ClipboardEntryEnriched,
    ClipboardUploadData,
    ExpirationStatus
} from './types';

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

export const getPublicClipboard = async (): Promise<ClipboardEntryEnriched[]> => {
    const url = PUBLIC_API_URL + '/clipboard/getPublicEntries';
    return fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(async (response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(await response.text());
        })
        .then((entries: ClipboardEntry[]) => {
            return entries.map((entry) => enrichEntry(entry));
        });
};

export const getAllClipboard = async (): Promise<ClipboardEntryEnriched[]> => {
    const url = PUBLIC_API_URL + '/clipboard/getAllEntries';
    const token = await getAccessToken();
    return fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        }
    })
        .then(async (response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(await response.text());
        })
        .then((entries: ClipboardEntry[]) => {
            return entries.map((entry) => enrichEntry(entry));
        });
};

export const uploadToClipboard = async (data: ClipboardUploadData) => {
    const url = PUBLIC_API_URL + '/clipboard/addEntry';
    const token = await getAccessToken();
    return fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
    }).then(async (response) => {
        if (response.ok) {
            return;
        }
        throw new Error(await response.text());
    });
};

export const deleteClipboardEntry = async (name: string) => {
    const url = PUBLIC_API_URL + '/clipboard/deleteEntry';
    const token = await getAccessToken();
    return fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name })
    }).then(async (response) => {
        if (response.ok) {
            return;
        }
        throw new Error(await response.text());
    });
};
