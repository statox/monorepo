import { requestAPIPost } from '$lib/api';
import type { HomeTrackerLatestResponse } from './types';

export const getHomeTrackerLatest = async (timeWindow: '3h' | '12h' | '1d' | '3d' | '7d') => {
    const result = await requestAPIPost<HomeTrackerLatestResponse>({
        path: '/homeTracker/getLatest',
        data: { timeWindow }
    });

    console.log('Got latest data:');
    console.log({ result });
    return result;
};
