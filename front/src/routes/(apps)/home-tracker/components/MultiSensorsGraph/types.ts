import type { HomeTrackerTimeData } from '$lib/HomeTracker';

export type GraphType =
    | 'temperature'
    | 'humidity'
    | 'battery'
    | 'pressure'
    | 'internalTemperature'
    | 'internalHumidity';

export interface GraphTypeProperties {
    graphName: string;
    metricUnitSymbol: string;
    metricProperty: keyof HomeTrackerTimeData;
}

export const graphsProperties: Record<GraphType, GraphTypeProperties> = {
    temperature: {
        graphName: 'Temperature',
        metricProperty: 'tempCelsius',
        metricUnitSymbol: 'C'
    },
    battery: {
        graphName: 'Battery',
        metricProperty: 'batteryCharge',
        metricUnitSymbol: 'V'
    },
    humidity: {
        graphName: 'Humidity',
        metricProperty: 'humidity',
        metricUnitSymbol: '%'
    },
    pressure: {
        graphName: 'Pressure',
        metricProperty: 'pressurehPa',
        metricUnitSymbol: 'hPa'
    },
    internalTemperature: {
        graphName: 'Internal Temperature',
        metricProperty: 'internalTempCelsius',
        metricUnitSymbol: 'C'
    },
    internalHumidity: {
        graphName: 'Internal Humidity',
        metricProperty: 'internalHumidity',
        metricUnitSymbol: '%'
    }
};
