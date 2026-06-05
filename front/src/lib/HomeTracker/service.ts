import type {
    HomeTrackerHistogramData,
    HomeTrackerTimeData,
    MetricDataPoint,
    SensorMetricStats,
    SensorMetadata
} from './types';

export const computeMetricsStats = (
    histogramData: HomeTrackerHistogramData,
    sensorNames: string[],
    sensorsData: SensorMetadata[],
    metricProperty: keyof HomeTrackerTimeData
): SensorMetricStats[] => {
    return sensorNames.reduce<SensorMetricStats[]>((acc, sensorName) => {
        const sensorMetadata = sensorsData.find((s) => s.sensorName === sensorName);
        const offset = metricProperty === 'tempCelsius' ? (sensorMetadata?.tempOffset ?? 0) : 0;

        const points: MetricDataPoint[] = Object.keys(histogramData)
            .filter((ts) => {
                const key = ts as unknown as keyof HomeTrackerHistogramData;
                return histogramData[key]?.[metricProperty]?.[sensorName] !== undefined;
            })
            .map((ts) => {
                const key = ts as unknown as keyof HomeTrackerHistogramData;
                return {
                    ts: Number(ts),
                    value: histogramData[key]![metricProperty]![sensorName]! + offset
                };
            })
            .sort((a, b) => a.ts - b.ts);

        if (points.length === 0) return acc;

        const first = points[0];
        const last = points[points.length - 1];
        const min = points.reduce((m, p) => (p.value < m.value ? p : m), points[0]);
        const max = points.reduce((m, p) => (p.value > m.value ? p : m), points[0]);
        const average = points.reduce((sum, p) => sum + p.value, 0) / points.length;

        acc.push({
            sensorName,
            hexColor: sensorMetadata?.hexColor ?? '#141414',
            iconPath: sensorMetadata?.iconPath ?? '',
            first,
            last,
            min,
            max,
            average
        });

        return acc;
    }, []);
};
