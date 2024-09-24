<script lang="ts">
    import type { WeatherForecast } from '$lib/HomeTracker';

    export let forecast: WeatherForecast;

    const trendIconClass = {
        rising: 'fa fa-arrow-up',
        falling: 'fa fa-arrow-down',
        steady: 'fas fa-equals'
    };
</script>

<div class="container">
    <div class="forecast-title">Forecast</div>
    <div class="forecast">{forecast.forecast}</div>
    <div class="trend-icon {trendIconClass[forecast.pressureTrend]}"></div>
    <div class="trend-value">{forecast.pressureTrend}</div>
</div>

<style>
    .container {
        border: solid 2px;
        border-color: var(--nc-tx-2);
        border-radius: 5px;

        padding: 0.3em;

        display: flex;
        flex-flow: row;
        align-items: baseline;
        gap: 1em;
    }

    .forecast-title {
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
</style>
