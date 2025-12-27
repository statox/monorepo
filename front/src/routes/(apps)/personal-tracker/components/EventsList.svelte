<script lang="ts">
    import { user } from '$lib/auth';
    import { Notice } from '$lib/components/Notice';
    import { getAndDecryptEvents, personalTrackerPassword } from '$lib/PersonalTracker';
    import type { PersonalTrackerEvent } from '$lib/PersonalTracker';
    import { DateTime } from 'luxon';

    const getEventsByCategory = async () => {
        const events = await getAndDecryptEvents($personalTrackerPassword);
        return events.reduce(
            (categories, event) => {
                if (!categories[event.type]) {
                    categories[event.type] = [];
                }
                categories[event.type].push(event);
                return categories;
            },
            {} as { [key: string]: PersonalTrackerEvent[] }
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
                <div>Value</div>
                <div>Data</div>
            </div>

            {#each categories[category] as event}
                {@const formatedDate = DateTime.fromSeconds(event.eventDateUnix)
                    .toLocal()
                    .toFormat('dd/MM/yy HH:mm')}
                <div class="event">
                    <div class="event-date">{formatedDate}</div>
                    <div class="event-value">{event.data}</div>
                    {#if typeof event.data === 'object' && event.data?.emotions}
                        <div class="selection">
                            {#each event.data.emotions as item}
                                <button class="emotion-item" style="--color: {item.color}">
                                    {item.category}
                                    {item.subcategory}
                                    {item.emotion}
                                </button>
                            {/each}
                        </div>
                    {/if}
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
    .emotion-item {
        background-color: var(--color);
        color: black;
    }
</style>
