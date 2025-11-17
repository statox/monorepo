import type { UserProfile } from '$lib/auth2';
import type {
    Ephemerides,
    HomeTrackerLatestResponse,
    PressureHistoryItem,
    SensorMetadata,
    WeatherForecast
} from '$lib/HomeTracker/types';
import type { ReactorEntryForPublic } from '$lib/Reactor/types';

import type {
    Auth_Login_Input,
    HomeTracker_HistogramData_Input,
    HomeTracker_HistogramDataPublic_Input,
    HomeTracker_UpdateSensorMetadata_Input
} from './client-types';
import { requestAPIGet, requestAPIPost } from './helpers';

export const client = {
    auth: {
        login: (data: Auth_Login_Input) => requestAPIPost<void>({ path: '/auth/login', data }),
        logout: () => requestAPIPost<void>({ path: '/auth/logout', data: {} }),
        me: () => requestAPIPost<UserProfile>({ path: '/auth/me', data: {} })
    },
    gravitrips: {
        getNewGame: () => requestAPIGet<{ gameId: string }>({ path: '/gravitrips/getNewGame' })
    },
    homeTracker: {
        getEphemerides: () =>
            requestAPIGet<{ ephemerides: Ephemerides }>({ path: '/homeTracker/getEphemerides' }),
        getSensorsDataForDashboard: () =>
            requestAPIGet<{ sensors: SensorMetadata[] }>({
                path: '/homeTracker/getSensorsDataForDashboard'
            }),
        getWeatherForecast: () =>
            requestAPIGet<{ forecast: WeatherForecast; pressureHistory: PressureHistoryItem[] }>({
                path: '/homeTracker/getWeatherForecast'
            }),
        histogramData: (data: HomeTracker_HistogramData_Input) =>
            requestAPIPost<HomeTrackerLatestResponse>({ path: '/homeTracker/histogramData', data }),
        histogramDataPublic: (data: HomeTracker_HistogramDataPublic_Input) =>
            requestAPIPost<HomeTrackerLatestResponse>({
                path: '/homeTracker/histogramDataPublic',
                data
            }),
        updateSensorMetadata: (data: HomeTracker_UpdateSensorMetadata_Input) =>
            requestAPIPost<void>({
                path: '/homeTracker/updateSensorMetadata',
                data
            })
    },
    reactor: {
        getEntriesForPublic: () =>
            requestAPIGet<ReactorEntryForPublic[]>({ path: '/reactor/getEntriesForPublic' })
    }
};
