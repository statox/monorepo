import { client2 } from '$lib/api';
import { getApiUrl } from '$lib/helpers';
import type { ReactorUploadData } from './types';
import superagent from 'superagent';

export const getReactionsForPublic = client2.reactor.getEntriesForPublic;

export const uploadToReactor = async (data: ReactorUploadData) => {
    const url = getApiUrl() + '/reactor/addEntry';

    await superagent
        .post(url)
        .withCredentials()
        .field('name', data.name)
        .field('commaSeparatedTags', data.commaSeparatedTags)
        // @ts-expect-error TODO Fix types
        .attach('file', data.file);
    return;
};
