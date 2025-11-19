import type { Ephemerides, SensorMetadata } from '$lib/HomeTracker/types';
import type { ReactorEntryForPublic } from '$lib/Reactor/types';

import { requestAPIGet } from './helpers';

export const client = {
    homeTracker: {
        getEphemerides: () =>
            requestAPIGet<{ ephemerides: Ephemerides }>({ path: '/homeTracker/getEphemerides' }),
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
