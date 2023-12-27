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

    let expirationStatus: ExpirationStatus = 'not soon';
    if (expirationDate < now) {
        expirationStatus = 'expired';
    } else if (expirationInSeconds < 60 * 60) {
        // 1 hour
        expirationStatus = 'very soon';
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
        .then((response) => {
            return response.json();
        })
        .then((entries: ClipboardEntry[]) => {
            return entries.map((entry) => enrichEntry(entry));
        });
};

export const getAllClipboard = async (): Promise<ClipboardEntryEnriched[]> => {
    const url = PUBLIC_API_URL + '/clipboard/getAllEntries';
    return getAccessToken().then(async (token) => {
        return fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        })
            .then((response) => {
                return response.json();
            })
            .then((entries: ClipboardEntry[]) => {
                return entries.map((entry) => enrichEntry(entry));
            });
    });
};

export const uploadToClipboard = async (data: ClipboardUploadData) => {
    const url = PUBLIC_API_URL + '/clipboard/addEntry';
    return getAccessToken().then(async (token) => {
        return fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
    });
};

export const deleteClipboardEntry = async (name: string) => {
    const url = PUBLIC_API_URL + '/clipboard/deleteEntry';
    return getAccessToken().then(async (token) => {
        return fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ name })
        });
    });
};
