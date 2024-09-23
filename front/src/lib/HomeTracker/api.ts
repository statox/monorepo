import { requestAPIGet, requestAPIPost } from '$lib/api';
import type {
    HomeTrackerLatestResponse,
    HomeTrackerSensorsResponse,
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
    const { forecast } = await requestAPIGet<{ forecast: WeatherForecast }>({
        path: '/homeTracker/getWeatherForecast'
    });
    return forecast;
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
