<script lang="ts">
    import { DateTime } from 'luxon';
    import { Notice } from '$lib/components/Notice';
    import { getYearlyEphemerides } from '$lib/HomeTracker';
</script>

<h2>Yearly Ephemerides</h2>

{#await getYearlyEphemerides() then ephemerides}
    {#each ephemerides as { day, ephemeride }}
        <div>
            {DateTime.fromMillis(day).toFormat('dd/MM/yy')} - {JSON.stringify(ephemeride)}
        </div>
    {/each}
{:catch error}
    <Notice
        item={{
            level: 'error',
            header: 'Something went wrong getting ephemerides data',
            message: error
        }}
    />
{/await}
