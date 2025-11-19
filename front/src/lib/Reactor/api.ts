import { PUBLIC_API_URL } from '$env/static/public';
import { client2 } from '$lib/api';
import type { ReactorUploadData } from './types';
import superagent from 'superagent';

export const getReactionsForPublic = client2.reactor.getEntriesForPublic;

export const uploadToReactor = async (data: ReactorUploadData) => {
    const url = PUBLIC_API_URL + '/reactor/addEntry';

    await superagent
        .post(url)
        .withCredentials()
        .field('name', data.name)
        .field('commaSeparatedTags', data.commaSeparatedTags)
        // @ts-expect-error TODO Fix types
        .attach('file', data.file);
    return;
};
