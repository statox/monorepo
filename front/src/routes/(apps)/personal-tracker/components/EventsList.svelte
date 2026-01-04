<script lang="ts">
    import { user } from '$lib/auth';
    import { Notice } from '$lib/components/Notice';
    import { getAndDecryptEvents, personalTrackerPassword } from '$lib/PersonalTracker';
    import { DateTime } from 'luxon';
    import { goto } from '$app/navigation';

    const getEvents = async () => {
        const events = await getAndDecryptEvents($personalTrackerPassword);
        // Sort by date, most recent first
        return events.sort((a, b) => b.eventDateUnix - a.eventDateUnix);
    };

    const handleEdit = (eventDateUnix: number) => {
        goto(`/personal-tracker/add/${eventDateUnix}`);
    };
</script>

{#if $user}
    {#await getEvents()}
        <p>Loading events</p>
    {:then events}
        <div class="events-header">
            <div>Date</div>
            <div>Mood</div>
            <div>Weight</div>
            <div>Emotions</div>
            <div>Actions</div>
        </div>

        {#each events as event}
            {@const formatedDate = DateTime.fromSeconds(event.eventDateUnix)
                .toLocal()
                .toFormat('dd/MM/yy HH:mm')}
            <div class="event">
                <div class="event-date">{formatedDate}</div>
                <div class="event-value">
                    {#if event.mood !== undefined}
                        {event.mood}
                    {:else}
                        -
                    {/if}
                </div>
                <div class="event-value">
                    {#if event.weight !== undefined}
                        {(event.weight / 100).toFixed(1)} kg
                    {:else}
                        -
                    {/if}
                </div>
                <div class="event-value">
                    {#if event.emotionwheel?.emotions}
                        <div class="selection">
                            {#each event.emotionwheel.emotions as item}
                                <button class="emotion-item" style="--color: {item.color}">
                                    {item.category}
                                    {item.subcategory}
                                    {item.emotion}
                                </button>
                            {/each}
                        </div>
                    {:else}
                        -
                    {/if}
                </div>
                <div class="event-actions">
                    <button onclick={() => handleEdit(event.eventDateUnix)}>Edit</button>
                </div>
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
    .events-header {
        display: grid;
        grid-template-columns: 150px 80px 100px 1fr 100px;
        gap: 1em;
        padding: 1em;
        font-weight: bold;
        border-bottom: 2px solid var(--nc-bg-3);
    }

    .event {
        display: grid;
        grid-template-columns: 150px 80px 100px 1fr 100px;
        gap: 1em;
        padding: 1em;
        border-bottom: 1px solid var(--nc-bg-2);
        align-items: center;
    }

    .event-value {
        overflow: hidden;
    }

    .selection {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
    }

    .emotion-item {
        background-color: var(--color);
        color: black;
        font-size: 0.8em;
        padding: 4px 8px;
        cursor: default;
    }

    .event-actions button {
        padding: 4px 12px;
    }
</style>
