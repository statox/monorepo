import type { SensorMetadata } from '$lib/HomeTracker/types';

import { requestAPIGet } from './helpers';

export const client = {
    homeTracker: {
        getSensorsDataForDashboard: () =>
            requestAPIGet<{ sensors: SensorMetadata[] }>({
                path: '/homeTracker/getSensorsDataForDashboard'
            })
    }
};
