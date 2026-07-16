<script lang="ts">
    import { onDestroy } from 'svelte';
    import { getSensorsMetadata, getHistogramData, type TimeWindow } from '$lib/HomeTracker';
    import { Notice } from '$lib/components/Notice';
    import { MultiSensorsGraph, type GraphType } from './MultiSensorsGraph';
    import { SuperDatePicker, type OnTimeChangeProps } from 'svelte-super-date-picker';

    const graphs: GraphType[] = [
        'temperature',
        'humidity',
        'pressure',
        'battery',
        'internalTemperature',
        'internalHumidity'
    ];

    const refreshData = async (timeWindowInput: TimeWindow) => {
        const histogramData = await getHistogramData({ timeWindow: timeWindowInput });
        const sensorsDetails = await getSensorsMetadata();
        return { histogramData, sensorsDetails };
    };

    // Matches the picker's default start="now-15m" end="now" props below.
    const defaultTimeWindow = (): TimeWindow => {
        const now = Date.now();
        return { startDateMs: now - 15 * 60 * 1000, endDateMs: now };
    };

    let currentTimeWindow = $state<TimeWindow>(defaultTimeWindow());
    // svelte-ignore state_referenced_locally
    let apiData = $state(refreshData(currentTimeWindow));

    const handleRefreshDataEvent = () => {
        apiData = refreshData(currentTimeWindow);
    };
    document.addEventListener('HomeTracker-RefreshData', handleRefreshDataEvent);
    onDestroy(() =>
        document.removeEventListener('HomeTracker-RefreshData', handleRefreshDataEvent)
    );

    const handleTimeChange = (props: OnTimeChangeProps) => {
        if (props.isInvalid) return;
        currentTimeWindow = { startDateMs: props.startDateMs, endDateMs: props.endDateMs };
        apiData = refreshData(currentTimeWindow);
    };

    const commonlyUsedRanges = [
        { start: 'now-30m', end: 'now', label: 'Last 30 minutes' },
        { start: 'now-1h', end: 'now', label: '1 hour' },
        { start: 'now-3h', end: 'now', label: '3 hours' },
        { start: 'now-1d', end: 'now', label: '1 day' },
        { start: 'now-3d', end: 'now', label: '3 days' },
        { start: 'now-1w', end: 'now', label: 'Last week' },
        { start: 'now-1M', end: 'now', label: 'Last month' },
        { start: 'now-1y', end: 'now', label: 'Last year' },
        { start: '2024-08-29T00:00:00.000Z', end: 'now', label: 'All time' }
    ];
</script>

<h1 class="title">
    <span>History</span>

    <SuperDatePicker
        start="now-15m"
        end="now"
        onTimeChange={handleTimeChange}
        {commonlyUsedRanges}
    />
</h1>

{#await apiData}
    <p>Loading history</p>
{:then { histogramData, sensorsDetails }}
    <div>
        {#each graphs as graphType}
            <MultiSensorsGraph
                sensorsData={sensorsDetails.sensors}
                histogramData={histogramData.histogramData}
                sensorNames={histogramData.sensorNames}
                {graphType}
            />
        {/each}
    </div>
{:catch error}
    <Notice
        item={{
            level: 'error',
            header: 'Something went wrong getting history',
            message: error
        }}
    />
{/await}

<style>
    .title {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
    }
</style>
