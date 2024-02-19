import { PUBLIC_API_URL } from '$env/static/public';
import { getAccessToken } from '$lib/auth/service';
import type { ReactorEntryForPublic, ReactorUploadData } from './types';
import superagent from 'superagent';

export const getReactionsForPublic = async (): Promise<ReactorEntryForPublic[]> => {
    const url = PUBLIC_API_URL + '/reactor/getEntriesForPublic';
    return fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(async (response) => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(await response.text());
    });
};

export const uploadToReactor = async (data: ReactorUploadData) => {
    const url = PUBLIC_API_URL + '/reactor/addEntry';
    const token = await getAccessToken();

    await superagent
        .post(url)
        .auth(token, { type: 'bearer' })
        .field('name', data.name)
        .field('commaSeparatedTags', data.commaSeparatedTags)
        // TODO: Fix types
        // @ts-ignore
        .attach('file', data.file);
    return;
};
