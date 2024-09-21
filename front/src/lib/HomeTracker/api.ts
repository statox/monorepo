import { requestAPIGet, requestAPIPost } from '$lib/api';
import type { HomeTrackerLatestResponse, HomeTrackerSensorsResponse, TimeWindow } from './types';

export const getHomeTrackerLatest = async (timeWindow: TimeWindow) => {
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
