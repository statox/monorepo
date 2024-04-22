import { PUBLIC_API_URL } from '$env/static/public';
import { requestAPIGet } from '$lib/api';
import { getAccessToken } from '$lib/auth/service';
import type { ReactorEntryForPublic, ReactorUploadData } from './types';
import superagent from 'superagent';

export const getReactionsForPublic = () => {
    return requestAPIGet<ReactorEntryForPublic[]>({ path: '/reactor/getEntriesForPublic' });
};

export const uploadToReactor = async (data: ReactorUploadData) => {
    const url = PUBLIC_API_URL + '/reactor/addEntry';
    const token = await getAccessToken();

    await superagent
        .post(url)
        .auth(token, { type: 'bearer' })
        .field('name', data.name)
        .field('commaSeparatedTags', data.commaSeparatedTags)
        // @ts-expect-error TODO Fix types
        .attach('file', data.file);
    return;
};
