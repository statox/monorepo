<script lang="ts">
    import { Notice } from '$lib/components/Notice';
    import { getLunarData, getMoonPhasePictureURL } from '$lib/HomeTracker';
</script>

<div class="container">
    {#await getLunarData()}
        <p>Loading lunar data</p>
    {:then lunarData}
        <div class="title">Moon</div>
        <div class="content">
            <div class="data">
                <span>Phase</span>
                <span>{lunarData.phaseFr}</span>

                <span>Age</span>
                <span>
                    {lunarData.lunarAge.toFixed(1)} days ({(
                        lunarData.lunarAgePercent * 100
                    ).toFixed(0)}%)
                </span>

                <span>Visible between</span>
                <span>
                    {lunarData.visibilityWindow[0]} - {lunarData.visibilityWindow[1]}
                </span>
            </div>
            <img
                class="phase-img"
                alt={lunarData.phase}
                src={getMoonPhasePictureURL(lunarData.phase)}
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
        grid-template-rows: repeat(3, 2em);

        /* row-gap: 1em; */
    }

    .phase-img {
        max-width: 20vw;
        min-width: 200px;
        border-radius: 10px;
    }
</style>
