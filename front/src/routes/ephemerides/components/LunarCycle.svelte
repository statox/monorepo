<script lang="ts">
    import type { DateTime } from 'luxon';
    import { getMoonPhaseIconURL, type EnrichedMoonState } from '$lib/HomeTracker';

    export let upcomingLunarStates: {
        date: DateTime;
        lunarState: EnrichedMoonState;
    }[];
</script>

<div class="container">
    {#each upcomingLunarStates.slice(0, 7) as { date }}
        <div class="day-header">
            {date.setLocale('fr').toLocaleString({ weekday: 'long' })}
        </div>
    {/each}
    {#each upcomingLunarStates as { date, lunarState }, index}
        <div class="entry">
            <img
                class="phase-img"
                alt={lunarState.moonPhase}
                src={getMoonPhaseIconURL(lunarState.moonPhase)}
            />
            {#if index === 0 || index === 29 || upcomingLunarStates[index - 1].lunarState.moonPhaseFr !== lunarState.moonPhaseFr}
                <div>
                    {date.setLocale('fr').toLocaleString({ day: '2-digit', month: '2-digit' })}
                </div>
                <div>{lunarState.moonPhaseFr}</div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: repeat(7, 1fr);

        max-width: 100%;
    }

    .day-header {
        background-color: var(--nc-bg-2);
        font-weight: bold;
        text-transform: capitalize;
    }
    .entry {
        display: flex;
        flex-direction: column;

        border: solid 1px var(--nc-bg-2);
        padding-top: 5px;
        padding-bottom: 5px;
    }
    .phase-img {
        max-height: 50px;
        border-radius: 10px;
    }
</style>
