import { PUBLIC_API_URL } from '$env/static/public';
import { getAccessToken } from '$lib/auth/service';
import type { ClipboardEntry, ClipboardUploadData } from './types';

export const getPublicClipboard = async (): Promise<ClipboardEntry[]> => {
    const url = PUBLIC_API_URL + '/clipboard/getPublicEntries';
    return fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then((response) => {
        return response.json();
    });
};

export const getAllClipboard = async (): Promise<ClipboardEntry[]> => {
    const url = PUBLIC_API_URL + '/clipboard/getAllEntries';
    return getAccessToken().then(async (token) => {
        return fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        }).then((response) => {
            return response.json();
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
