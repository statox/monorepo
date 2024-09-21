import { requestAPIGet, requestAPIPost } from '$lib/api';
import type { HomeTrackerLatestResponse, HomeTrackerSensorsResponse, TimeWindow } from './types';

export const getHistogramData = async (timeWindow: TimeWindow) => {
    return await requestAPIPost<HomeTrackerLatestResponse>({
        path: '/homeTracker/histogramData',
        data: { timeWindow }
    });
};

export const getAllSensorsWithLatestLog = async () => {
    return await requestAPIGet<HomeTrackerSensorsResponse>({
        path: '/homeTracker/allSensorsWithLatestLog'
    });
};
