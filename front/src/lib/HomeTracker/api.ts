import { client2 } from '$lib/api';
import { APIClient, type HomeTracker_Upload_Input } from 'statox-api';

export const getHistogramData = client2.homeTracker.histogramData;

export const getWeatherForecast = client2.homeTracker.getWeatherForecast;

export const getSensorsMetadata = async () => {
    const { sensors } = await client2.homeTracker.getSensorsDataForDashboard();

    // TODO Have this info returned by the API (and probably have the API returning the images themselves too)
    const enrichedSensors = sensors.map((sensor) => {
        const { sensorName } = sensor;
        return {
            ...sensor,
            iconPath: `/hometracker/sensors/icon_${sensorName}.png`
        };
    });

    return { sensors: enrichedSensors };
};

export const updateSensorMetadata = client2.homeTracker.updateSensorMetadata;

export const enableSensorBoost = client2.homeTracker.enableSensorBoost;

export const uploadSensorData = (
    connection: { apiKey: string; hostname: string },
    input: HomeTracker_Upload_Input
) => {
    const client = APIClient({ baseURL: connection.hostname, apiKey: connection.apiKey });
    return client.homeTracker.upload(input);
};
