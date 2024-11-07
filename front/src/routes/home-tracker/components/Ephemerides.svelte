<script lang="ts">
    import { Notice } from '$lib/components/Notice';
    import { getEphemerides, getMoonPhasePictureURL } from '$lib/HomeTracker';
</script>

<div class="container">
    {#await getEphemerides()}
        <p>Loading ephemerides data</p>
    {:then ephemerides}
        <div class="title">Ephemerides</div>
        <div class="content">
            <div class="data">
                <span>Moon phase</span>
                <span>{ephemerides.moonPhaseFr}</span>

                <span>Moon age</span>
                <span>
                    {ephemerides.lunarAge.toFixed(1)} days ({(
                        ephemerides.lunarAgePercent * 100
                    ).toFixed(0)}%)
                </span>

                <span>Moon visible</span>
                <span>
                    {ephemerides.moonVisibilityWindow[0]} - {ephemerides.moonVisibilityWindow[1]}
                </span>

                <span>Sun rise/set</span>
                <span>
                    {ephemerides.sunrise.toFormat('HH:mm')} - {ephemerides.sunset.toFormat('HH:mm')}
                </span>

                <span>Solar noon</span>
                <span>
                    {ephemerides.solarNoon.toFormat('HH:mm')}
                </span>

                <span>Golden hour</span>
                <span>
                    {ephemerides.goldenHour.toFormat('HH:mm')}
                </span>
            </div>
            <img
                class="phase-img"
                alt={ephemerides.moonPhase}
                src={getMoonPhasePictureURL(ephemerides.moonPhase)}
            />
        </div>
    {:catch error}
        <Notice
            item={{
                level: 'error',
                header: 'Something went wrong getting lunar data',
                message: error
            }}
        />
    {/await}
</div>

<style>
    .container {
        border: solid 2px;
        border-color: #9edcff;
        border-radius: 5px;

        padding: 0.3em;

        display: flex;
        flex-flow: column;
        gap: 1em;
    }

    .title {
        color: var(--nc-tx-1);
        font-weight: bold;
        font-size: x-large;
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
