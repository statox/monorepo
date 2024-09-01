import { requestAPIGet } from '$lib/api';
import type { HomeTrackerLatestResponse } from './types';

export const getHomeTrackerLatest = async () => {
    return await requestAPIGet<HomeTrackerLatestResponse>({
        path: '/homeTracker/getLatest'
    });
};
