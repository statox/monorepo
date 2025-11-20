<script lang="ts">
    import { user } from '$lib/auth';
    import { Notice } from '$lib/components/Notice';
    import type { PersonalEvent } from '$lib/PersonalTracker/types';
    import { DateTime } from 'luxon';

    interface Props {
        events: Promise<PersonalEvent[]> | undefined;
    }

    let { events }: Props = $props();
</script>

{#if $user && events}
    {#await events}
        <p>Loading events</p>
    {:then events}
        <div class="event">
            <div>Date</div>
            <div>Type</div>
            <div>Value</div>
        </div>

        {#each events as event}
            {@const formatedDate = DateTime.fromSeconds(event.eventDateUnix)
                .toLocal()
                .toFormat('dd/MM/yy HH:mm')}
            <div class="event">
                <div class="event-date">{formatedDate}</div>
                <div class="event-type">{event.type}</div>
                <div class="event-value">{event.value}</div>
            </div>
        {/each}
    {:catch error}
        <Notice
            item={{
                level: 'error',
                header: 'Something went wrong getting events',
                message: error
            }}
        />
    {/await}
{/if}

<style>
    .event {
        display: grid;
        row-gap: 1em;
        grid-template-columns: repeat(3, 33%);
        margin: 1em;
    }
</style>
