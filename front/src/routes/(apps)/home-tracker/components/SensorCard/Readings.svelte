<script lang="ts">
    import { ValueWithUnit } from '$lib/components/ValueWithUnit';
    import type { SensorMetadata } from '$lib/HomeTracker';
    import DataTrend from '../DataTrend.svelte';

    interface Props {
        sensor: SensorMetadata;
    }

    let { sensor }: Props = $props();
</script>

<div class="sensor-data-records-container-with-trend">
    <i class="unit-icon fas fa-thermometer-half"></i>
    <ValueWithUnit value={sensor.lastLogData.tempCelsius} unitString="°C" precision={1} />
    <DataTrend
        oldValue={sensor.oneHourAgoLogData.tempCelsius || 0}
        newValue={sensor.lastLogData.tempCelsius || 0}
        oldTimestamp={sensor.oneHourAgoLogData.timestamp}
        newTimestamp={sensor.lastLogData.timestamp}
    />
    <DataTrend
        oldValue={sensor.oneDayAgoLogData.tempCelsius || 0}
        newValue={sensor.lastLogData.tempCelsius || 0}
        oldTimestamp={sensor.oneDayAgoLogData.timestamp}
        newTimestamp={sensor.lastLogData.timestamp}
    />

    <i class="unit-icon fas fa-tint"></i>
    <ValueWithUnit value={sensor.lastLogData.humidity} unitString="%" precision={0} />
    <DataTrend
        oldValue={sensor.oneHourAgoLogData.humidity || 0}
        newValue={sensor.lastLogData.humidity || 0}
        oldTimestamp={sensor.oneHourAgoLogData.timestamp}
        newTimestamp={sensor.lastLogData.timestamp}
    />
    <DataTrend
        oldValue={sensor.oneDayAgoLogData.humidity || 0}
        newValue={sensor.lastLogData.humidity || 0}
        oldTimestamp={sensor.oneDayAgoLogData.timestamp}
        newTimestamp={sensor.lastLogData.timestamp}
    />

    {#if sensor.lastLogData.pressurehPa}
        <i class="unit-icon fas fa-tachometer-alt"></i>
        <ValueWithUnit value={sensor.lastLogData.pressurehPa} unitString="hPa" precision={0} />
        <i></i>
    {/if}
</div>

{#if sensor.lastLogData.internalTempCelsius || sensor.lastLogData.internalHumidity}
    <div class="sensor-data-records-container internal-data">
        <i class="unit-icon fas fa-thermometer-half"></i>
        <ValueWithUnit
            value={sensor.lastLogData.internalTempCelsius}
            unitString="°C"
            precision={1}
        />

        <i class="unit-icon fas fa-tint"></i>
        <ValueWithUnit value={sensor.lastLogData.internalHumidity} unitString="%" precision={0} />
    </div>
{/if}

{#if sensor.lastLogData.batteryPercent}
    <div class="sensor-data-records-container internal-data">
        <i
            class="power-icon fas fa-bolt"
            class:low-power-icon={sensor.lastLogData.batteryPercent < 10}
        ></i>
        <ValueWithUnit value={sensor.lastLogData.batteryPercent} unitString="%" precision={0} />
    </div>
{/if}

<style>
    .sensor-data-records-container {
        display: grid;
        font-size: x-large;

        grid-template-columns: 2ch repeat(2, minmax(min-content, max-content));
        align-items: baseline;
    }
    .sensor-data-records-container-with-trend {
        display: grid;
        font-size: x-large;

        grid-template-columns: 2ch repeat(2, minmax(min-content, max-content)) 1fr 1fr;
        align-items: baseline;
    }
    .internal-data {
        font-size: medium;
        color: var(--nc-tx-1);
    }

    .unit-icon {
        font-size: large;
    }

    .power-icon {
        color: #cecb18;
    }

    .low-power-icon {
        color: var(--nc-error);
    }
</style>
