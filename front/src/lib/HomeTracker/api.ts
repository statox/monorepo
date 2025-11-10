import { client } from '$lib/api';
import type { SensorMetadata } from './types';

export const getHistogramData = client.homeTracker.histogramData;

export const getHistogramDataPublic = client.homeTracker.histogramDataPublic;

export const getWeatherForecast = client.homeTracker.getWeatherForecast;

export const getEphemeridesAPI = client.homeTracker.getEphemerides;

export const getSensorsMetadata = async () => {
    const { sensors } = await client.homeTracker.getSensorsDataForDashboard();

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

export const updateSensorMetadata = client.homeTracker.updateSensorMetadata;
