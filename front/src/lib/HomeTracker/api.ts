import { requestAPIGet } from '$lib/api';
import type { HomeTrackerLatestResponse } from './types';

export const getHomeTrackerLatest = async () => {
    console.log('getHomeTrackerLatest()');
    const result = await requestAPIGet<HomeTrackerLatestResponse>({
        path: '/homeTracker/getLatest'
    });

    console.log('Got latest data:');
    console.log({ result });
    return result;
};
