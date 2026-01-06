<script lang="ts">
    import { Notice } from '$lib/components/Notice';
    import { eventsStore, personalTrackerPassword } from '$lib/PersonalTracker';
    import { DateTime } from 'luxon';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { SvelteSet } from 'svelte/reactivity';

    // Fetch events on mount if not already cached
    onMount(() => {
        eventsStore.fetch($personalTrackerPassword);
    });

    const handleEdit = (eventDateUnix: number) => {
        goto(`/personal-tracker/add/${eventDateUnix}`);
    };

    // Emoji mappings
    const moodEmojis = ['😢', '😟', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '😍'];
    const energyEmojis = ['😴', '😪', '🥱', '😑', '😐', '🙂', '😊', '😄', '⚡', '🔋'];

    // Track which journals are expanded
    const expandedJournals = new SvelteSet<number>();

    const toggleJournal = (eventDateUnix: number) => {
        if (expandedJournals.has(eventDateUnix)) {
            expandedJournals.delete(eventDateUnix);
        } else {
            expandedJournals.add(eventDateUnix);
        }
    };
</script>

{#if $eventsStore.loading}
    <p>Loading events</p>
{:else if $eventsStore.error}
    <Notice
        item={{
            level: 'error',
            header: 'Something went wrong getting events',
            message: $eventsStore.error.message
        }}
    />
{:else}
    <div class="events-header">
        <div>Date</div>
        <div>Mood</div>
        <div>Energy</div>
        <div>Weight</div>
        <div>Workplace</div>
        <div>Emotions</div>
        <div>Journal</div>
        <div>Actions</div>
    </div>

    {#each $eventsStore.events.sort((a, b) => b.eventDateUnix - a.eventDateUnix) as event}
        {@const formatedDate = DateTime.fromSeconds(event.eventDateUnix).toFormat(
            'EEEE, d MMMM yyyy'
        )}
        {@const isJournalExpanded = expandedJournals.has(event.eventDateUnix)}
        <div class="event">
            <div class="event-date">{formatedDate}</div>
            <div class="event-value" data-label="Mood:">
                {#if event.mood !== undefined}
                    <span class="emoji-value">
                        {moodEmojis[event.mood - 1]}
                        {event.mood}
                    </span>
                {:else}
                    -
                {/if}
            </div>
            <div class="event-value" data-label="Energy:">
                {#if event.energy !== undefined}
                    <span class="emoji-value">
                        {energyEmojis[event.energy - 1]}
                        {event.energy}
                    </span>
                {:else}
                    -
                {/if}
            </div>
            <div class="event-value" data-label="Weight:">
                {#if event.weight !== undefined}
                    {(event.weight / 100).toFixed(1)} kg
                {:else}
                    -
                {/if}
            </div>
            <div class="event-value" data-label="Workplace:">
                {#if event.workplace !== undefined}
                    <span class="emoji-value">
                        {event.workplace === 'remote' ? '🏠' : '🏢'}
                    </span>
                {:else}
                    -
                {/if}
            </div>
            <div class="event-value" data-label="Emotions:">
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
            <div class="event-value journal-cell">
                {#if event.journal !== undefined}
                    <button
                        class="journal-toggle"
                        onclick={() => toggleJournal(event.eventDateUnix)}
                    >
                        {isJournalExpanded ? '📖 Hide' : '📝 Show'}
                    </button>
                    {#if isJournalExpanded}
                        <div class="journal-text">
                            {event.journal}
                        </div>
                    {/if}
                {:else}
                    -
                {/if}
            </div>
            <div class="event-actions">
                <button onclick={() => handleEdit(event.eventDateUnix)}>Edit</button>
            </div>
        </div>
    {/each}
{/if}

<style>
    .events-header {
        display: grid;
        grid-template-columns: 150px 100px 100px 100px 80px 1fr 120px 100px;
        gap: 1em;
        padding: 1em;
        font-weight: bold;
        border-bottom: 2px solid var(--nc-bg-3);
    }

    .event {
        display: grid;
        grid-template-columns: 150px 100px 100px 100px 80px 1fr 120px 100px;
        gap: 1em;
        padding: 1em;
        border-bottom: 1px solid var(--nc-bg-2);
        align-items: start;
    }

    .event-date {
        font-weight: 500;
    }

    .event-value {
        overflow: hidden;
    }

    .emoji-value {
        display: inline-flex;
        align-items: center;
        gap: 0.25em;
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

    .journal-cell {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
    }

    .journal-toggle {
        padding: 4px 8px;
        font-size: 0.85em;
        cursor: pointer;
        align-self: flex-start;
    }

    .journal-text {
        padding: 0.5em;
        background-color: var(--nc-bg-2);
        border-radius: 4px;
        font-size: 0.9em;
        line-height: 1.4;
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    .event-actions button {
        padding: 4px 12px;
    }

    /* Tablet view */
    @media (max-width: 1024px) {
        .events-header {
            grid-template-columns: 120px 80px 80px 80px 60px 1fr 100px 80px;
            font-size: 0.9em;
        }

        .event {
            grid-template-columns: 120px 80px 80px 80px 60px 1fr 100px 80px;
            font-size: 0.9em;
        }
    }

    /* Mobile view - Card layout */
    @media (max-width: 768px) {
        .events-header {
            display: none;
        }

        .event {
            display: flex;
            flex-direction: column;
            gap: 0.75em;
            padding: 1em;
            border: 1px solid var(--nc-bg-3);
            border-radius: 8px;
            margin-bottom: 1em;
            background-color: var(--nc-bg-1);
        }

        .event-date {
            font-size: 1.1em;
            font-weight: bold;
            padding-bottom: 0.5em;
            border-bottom: 1px solid var(--nc-bg-3);
        }

        .event-value {
            display: grid;
            grid-template-columns: 100px 1fr;
            align-items: start;
            gap: 0.5em;
        }

        .event-value::before {
            content: attr(data-label);
            font-weight: bold;
            font-size: 0.9em;
        }

        .journal-cell {
            grid-column: 1 / -1;
        }

        .journal-cell::before {
            content: 'Journal:';
            font-weight: bold;
            font-size: 0.9em;
            margin-bottom: 0.25em;
        }

        .event-actions {
            display: flex;
            justify-content: flex-end;
            padding-top: 0.5em;
            border-top: 1px solid var(--nc-bg-3);
        }

        .event-actions button {
            padding: 8px 16px;
        }
    }

    /* Extra small mobile */
    @media (max-width: 480px) {
        .event {
            padding: 0.75em;
            gap: 0.5em;
        }

        .event-value {
            grid-template-columns: 90px 1fr;
            font-size: 0.9em;
        }

        .emotion-item {
            font-size: 0.75em;
            padding: 3px 6px;
        }
    }
</style>
