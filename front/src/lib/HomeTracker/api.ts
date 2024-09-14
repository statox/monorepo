import { requestAPIGet, requestAPIPost } from '$lib/api';
import type { HomeTrackerLatestResponse, HomeTrackerSensorsResponse } from './types';

export const getHomeTrackerLatest = async (timeWindow: '3h' | '12h' | '1d' | '3d' | '7d') => {
    return await requestAPIPost<HomeTrackerLatestResponse>({
        path: '/homeTracker/getLatest',
        data: { timeWindow }
    });
};

export const getHomeTrackerSensors = async () => {
    return await requestAPIGet<HomeTrackerSensorsResponse>({
        path: '/homeTracker/sensors'
    });
};
