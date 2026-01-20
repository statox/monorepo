<script lang="ts">
    import { AuthGuard } from '$lib/components/AuthGuard';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import EventsList from './components/EventsList.svelte';
    import EventsCalendar from './components/EventsCalendar.svelte';
    import EventsMetrics from './components/EventsMetrics.svelte';
    import PasswordGuard from './components/PasswordGuard.svelte';

    import { pageMetadataStore } from '$lib/components/Header';
    import { goto } from '$app/navigation';

    const pageMetadata = {
        name: 'Personal Tracker',
        description: 'Track me metrics',
        iconPath: '/personal_tracker.png',
        showAuthInHeader: true
    } as const;
    pageMetadataStore.set(pageMetadata);

    // View mode toggle
    type ViewMode = 'calendar' | 'list' | 'metrics';
    const viewModes: ViewMode[] = ['calendar', 'list', 'metrics'];
    let viewMode = $state<ViewMode>('calendar');

    const toggleView = () => {
        const currentIndex = viewModes.indexOf(viewMode);
        viewMode = viewModes[(currentIndex + 1) % viewModes.length];
    };

    const viewLabels: Record<ViewMode, string> = {
        calendar: '📅 Calendar',
        list: '📋 List',
        metrics: '📊 Metrics'
    };
</script>

<HeadIOS
    title={pageMetadata.name}
    description={pageMetadata.description}
    iconPath={pageMetadata.iconPath}
/>

<AuthGuard message="Login to see events" requiredScope="admin">
    <PasswordGuard>
        <div class="controls">
            <button onclick={() => goto('/personal-tracker/add')}>Add Today's entry</button>
            <button onclick={toggleView} class="view-toggle">
                {viewLabels[viewModes[viewModes.indexOf(viewMode)]]}
            </button>
        </div>

        {#if viewMode === 'calendar'}
            <EventsCalendar />
        {:else if viewMode === 'list'}
            <EventsList />
        {:else}
            <EventsMetrics />
        {/if}
    </PasswordGuard>
</AuthGuard>

<style>
    .controls {
        display: flex;
        gap: 1em;
        margin-bottom: 1em;
        padding: 1em;
        flex-wrap: wrap;
    }

    .view-toggle {
        margin-left: auto;
    }
</style>
