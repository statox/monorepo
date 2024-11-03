<script lang="ts">
    import { Notice } from '$lib/components/Notice';
    import { getLunarData, getMoonPhasePictureURL } from '$lib/HomeTracker';
</script>

<div class="container">
    {#await getLunarData()}
        <p>Loading lunar data</p>
    {:then lunarData}
        <div class="title">{lunarData.phaseFr}</div>
        <div class="data">
            <div>
                Moon age: {lunarData.lunarAge.toFixed(1)} days ({(
                    lunarData.lunarAgePercent * 100
                ).toFixed(0)}%)
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

    .data {
        display: flex;
        flex-flow: row;
        flex-wrap: wrap;

        gap: 2em;
    }

    .phase-img {
        max-width: 20vw;
        min-width: 200px;
        border-radius: 10px;
    }
</style>
