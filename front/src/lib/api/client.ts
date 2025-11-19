import type { SensorMetadata } from '$lib/HomeTracker/types';
import type { ReactorEntryForPublic } from '$lib/Reactor/types';

import { requestAPIGet } from './helpers';

export const client = {
    homeTracker: {
        getSensorsDataForDashboard: () =>
            requestAPIGet<{ sensors: SensorMetadata[] }>({
                path: '/homeTracker/getSensorsDataForDashboard'
            })
    },
    reactor: {
        getEntriesForPublic: () =>
            requestAPIGet<ReactorEntryForPublic[]>({ path: '/reactor/getEntriesForPublic' })
    }
};
