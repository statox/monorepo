<script lang="ts">
    import { Notice } from '$lib/components/Notice';
    import { TimeWindowPicker } from '$lib/components/TimeWindowPicker';
    import { eventsStore, personalTrackerPassword } from '$lib/PersonalTracker';
    import { DateTime } from 'luxon';
    import { onMount } from 'svelte';
    import EmotionsDailyBars from './EmotionsDailyBars.svelte';
    import EmotionsPieChart from './EmotionsPieChart.svelte';
    import EmotionsStreamGraph from './EmotionsStreamGraph.svelte';
    import MoodEnergyChart from './MoodEnergyChart.svelte';

    // Fetch events on mount if not already cached
    onMount(() => {
        eventsStore.fetch($personalTrackerPassword);
    });

    let startDate = $state(DateTime.now().minus({ week: 1 }).toMillis());
    let endDate = $state(DateTime.now().toMillis());

    let filteredEvents = $derived(
        $eventsStore.events
            .filter((e) => e.eventDateUnix >= startDate / 1000 && e.eventDateUnix <= endDate / 1000)
            .sort((a, b) => b.eventDateUnix - a.eventDateUnix)
    );
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
    <TimeWindowPicker bind:startDate bind:endDate />
    <MoodEnergyChart events={filteredEvents} />
    <EmotionsStreamGraph events={filteredEvents} />
    <EmotionsDailyBars events={filteredEvents} />
    <EmotionsPieChart events={filteredEvents} />
{/if}
