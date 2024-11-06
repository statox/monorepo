import { requestAPIGet, requestAPIPost } from '$lib/api';
import type {
    HomeTrackerLatestResponse,
    HomeTrackerSensorsResponse,
    LunarData,
    PressureHistoryItem,
    SensorState,
    TimeWindow,
    WeatherForecast
} from './types';

export const getHistogramData = async (timeWindow: TimeWindow) => {
    return await requestAPIPost<HomeTrackerLatestResponse>({
        path: '/homeTracker/histogramData',
        data: { timeWindow }
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

export const getLunarData = async () => {
    const { currentLunarState } = await requestAPIGet<{ currentLunarState: LunarData }>({
        path: '/homeTracker/getLunarData'
    });
    return currentLunarState;
};

export const getAllSensorsWithLatestLog = async () => {
    const { sensors } = await requestAPIGet<HomeTrackerSensorsResponse>({
        path: '/homeTracker/allSensorsWithLatestLog'
    });

    // TODO Have this info returned by the API (and probably have the API returning the images themselves too)
    const enrichedSensors = sensors.map((sensor: SensorState) => {
        const { sensorName } = sensor;
        return {
            ...sensor,
            iconPath: `/hometracker/sensors/icon_${sensorName}.png`
        };
    });

    return { sensors: enrichedSensors };
};
