<script lang="ts">
    import { user } from '$lib/auth';
    import { Notice } from '$lib/components/Notice';
    import { getAllEvents } from '$lib/PersonalTracker/api';
    import type { PersonalEvent } from '$lib/PersonalTracker/types';
    import { DateTime } from 'luxon';

    const getEventsByCategory = async () => {
        const events = await getAllEvents();
        return events.reduce(
            (categories, event) => {
                if (!categories[event.type]) {
                    categories[event.type] = [];
                }
                categories[event.type].push(event);
                return categories;
            },
            {} as { [key: string]: PersonalEvent[] }
        );
    };
</script>

{#if $user}
    {#await getEventsByCategory()}
        <p>Loading events</p>
    {:then categories}
        {#each Object.keys(categories) as category}
            <h4>{category}</h4>
            <div class="event">
                <div>Date</div>
                <div>Type</div>
                <div>Value</div>
            </div>

            {#each categories[category] as event}
                {@const formatedDate = DateTime.fromSeconds(event.eventDateUnix)
                    .toLocal()
                    .toFormat('dd/MM/yy HH:mm')}
                <div class="event">
                    <div class="event-date">{formatedDate}</div>
                    <div class="event-type">{event.type}</div>
                    <div class="event-value">{event.value}</div>
                </div>
            {/each}
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
