<script lang="ts">
    import { AuthGuard } from '$lib/components/AuthGuard';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import EventsList from './components/EventsList.svelte';
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
</script>

<HeadIOS
    title={pageMetadata.name}
    description={pageMetadata.description}
    iconPath={pageMetadata.iconPath}
/>

<AuthGuard message="Login to see events">
    <PasswordGuard>
        <div>
            <button onclick={() => goto('/personal-tracker/add')}>Add an entry</button>
        </div>
        <EventsList />
    </PasswordGuard>
</AuthGuard>
