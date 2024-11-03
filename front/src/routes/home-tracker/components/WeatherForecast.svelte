<script lang="ts">
    import { Notice } from '$lib/components/Notice';
    import { ValueWithUnit } from '$lib/components/ValueWithUnit';
    import { formatRecordTimestampToHuman, getWeatherForecast } from '$lib/HomeTracker';

    const trendIconClass = {
        rising: 'fa fa-arrow-up',
        falling: 'fa fa-arrow-down',
        steady: 'fas fa-equals'
    };

    const getForecastData = async () => {
        const forecast = await getWeatherForecast();

        let oldestDataPointTime: string | undefined = 'no data';
        let latestDataPointTime: string | undefined = 'no data';

        if (forecast.dataPoints) {
            try {
                oldestDataPointTime = formatRecordTimestampToHuman(
                    forecast.dataPoints?.oldest.timestampMs
                );
            } catch {
                oldestDataPointTime = 'Cant parse date';
            }
            try {
                latestDataPointTime = formatRecordTimestampToHuman(
                    forecast.dataPoints?.latest.timestampMs
                );
            } catch {
                latestDataPointTime = 'Cant parse date';
            }
        }

        return { forecast, oldestDataPointTime, latestDataPointTime };
    };
</script>

<div class="container">
    {#await getForecastData()}
        <p>Loading weather forecast</p>
    {:then { forecast, oldestDataPointTime, latestDataPointTime }}
        <div class="forecast-container">
            <div class="section-title">Forecast</div>
            <div class="forecast">{forecast.forecast}</div>
            <div class="trend-icon {trendIconClass[forecast.pressureTrend]}"></div>
            <div class="trend-value">{forecast.pressureTrend}</div>
        </div>
        {#if forecast.dataPoints}
            <div class="datapoint-container">
                <div class="section-title">Data points</div>
                <div>
                    <span class="data-header">Oldest</span>
                    {oldestDataPointTime} - <ValueWithUnit
                        value={forecast.dataPoints.oldest.pressurehPa}
                        unitString={'hPa'}
                        precision={3}
                    />
                </div>
                <div>
                    <span class="data-header">Latest</span>
                    {latestDataPointTime} - <ValueWithUnit
                        value={forecast.dataPoints.latest.pressurehPa}
                        unitString={'hPa'}
                        precision={3}
                    />
                </div>
                <div>
                    <span class="data-header">Diff</span>
                    {(
                        forecast.dataPoints.latest.pressurehPa -
                        forecast.dataPoints.oldest.pressurehPa
                    ).toFixed(2)}
                    <span class="small-text">(Threshold 1.6)</span>
                </div>
            </div>
        {/if}
    {:catch error}
        <Notice
            item={{
                level: 'error',
                header: 'Something went wrong getting weather forecast',
                message: error
            }}
        />
    {/await}
</div>

<style>
    .container {
        border: solid 2px;
        border-color: var(--nc-tx-2);
        border-radius: 5px;

        padding: 0.3em;

        display: flex;
        flex-flow: column;
        gap: 1em;
    }

    .forecast-container {
        padding: 0.3em;

        display: flex;
        flex-flow: row;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 1em;
    }

    .section-title {
        color: var(--nc-tx-1);
        font-weight: bold;
        font-size: x-large;
    }

    .trend-icon {
        font-size: medium;
        color: var(--nc-tx-1);
    }

    .trend-value {
        font-size: small;
    }

    .datapoint-container {
        padding: 0.3em;

        display: flex;
        flex-flow: column;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 1em;
    }

    .small-text {
        font-size: x-small;
    }

    .data-header {
        color: var(--nc-tx-1);
    }
</style>
