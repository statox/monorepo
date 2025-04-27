<script lang="ts">
    import { getMoonPhasePictureURL } from '$lib/HomeTracker';

    export let moonState;
    export let sunState;
</script>

<div class="container">
    <div class="content">
        <div class="data">
            <span>Moon phase</span>
            <span>{moonState.moonPhaseFr}</span>

            <span>Moon age</span>
            <span>
                {moonState.lunarAge.toFixed(1)} days ({(moonState.lunarAgePercent * 100).toFixed(
                    0
                )}%)
            </span>

            <span>Moon visible</span>
            <span>
                {moonState.moonVisibilityWindow[0]} - {moonState.moonVisibilityWindow[1]}
            </span>

            <span>Sun rise/set</span>
            <span>
                {sunState.sunrise.toFormat('HH:mm')} - {sunState.sunset.toFormat('HH:mm')}
            </span>

            <span>Solar noon</span>
            <span>
                {sunState.solarNoon.toFormat('HH:mm')}
            </span>

            <span>Golden hour</span>
            <span>
                {sunState.goldenHour.toFormat('HH:mm')}
            </span>
        </div>
        <img
            class="phase-img"
            alt={moonState.moonPhase}
            src={getMoonPhasePictureURL(moonState.moonPhase)}
        />
    </div>
</div>

<style>
    .container {
        border-bottom: solid 2px;
        border-color: #9edcff;
        border-radius: 5px;

        padding: 0.3em;

        display: flex;
        flex-flow: column;
        gap: 1em;
    }

    .content {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        gap: 1em;
    }

    .data {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: repeat(6, 2em);

        /* row-gap: 1em; */
    }

    .phase-img {
        max-width: 20vw;
        min-width: 200px;
        border-radius: 10px;
    }
</style>
