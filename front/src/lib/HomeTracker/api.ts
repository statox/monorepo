import { requestAPIGet, requestAPIPost } from '$lib/api';
import type {
    SensorMetadata,
    Ephemerides,
    HomeTrackerLatestResponse,
    PressureHistoryItem,
    TimeWindow,
    TimeWindowPublic,
    WeatherForecast
} from './types';

export const getHistogramData = async (timeWindow: TimeWindow) => {
    return await requestAPIPost<HomeTrackerLatestResponse>({
        path: '/homeTracker/histogramData',
        data: { timeWindow }
    });
};

export const getHistogramDataPublic = async (timeWindow: TimeWindowPublic) => {
    return await requestAPIPost<HomeTrackerLatestResponse>({
        path: '/homeTracker/histogramDataPublic',
        data: { timeWindow },
        isUnauthenticatedCall: true
    });
};

export const getWeatherForecast = async () => {
    const { forecast, pressureHistory } = await requestAPIGet<{
        forecast: WeatherForecast;
        pressureHistory: PressureHistoryItem[];
    }>({
        path: '/homeTracker/getWeatherForecast'
    });
    return { forecast, pressureHistory };
};

export const getEphemeridesAPI = async () => {
    const { ephemerides } = await requestAPIGet<{ ephemerides: Ephemerides }>({
        path: '/homeTracker/getEphemerides'
    });
    return ephemerides;
};

export const getSensorsMetadata = async () => {
    const { sensors } = await requestAPIGet<{
        sensors: SensorMetadata[];
    }>({
        path: '/homeTracker/getSensorsDataForDashboard'
    });

    // TODO Have this info returned by the API (and probably have the API returning the images themselves too)
    const enrichedSensors = sensors.map((sensor: SensorMetadata) => {
        const { sensorName } = sensor;
        return {
            ...sensor,
            iconPath: `/hometracker/sensors/icon_${sensorName}.png`
        };
    });

    return { sensors: enrichedSensors };
};

export const updateSensorMetadata = (params: {
    sensorName: string;
    hexColor: string;
    tempOffset: number;
    sleepTimeSec: number;
}) => {
    return requestAPIPost<void>({ path: '/homeTracker/updateSensorMetadata', data: params });
};
