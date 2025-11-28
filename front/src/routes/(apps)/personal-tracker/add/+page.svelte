<script lang="ts">
    import { toast } from '$lib/components/Toast';
    import { user } from '$lib/auth';
    import { Notice } from '$lib/components/Notice';
    import EventFormWeight from '../components/EventFormWeight.svelte';
    import EventFormMood from '../components/EventFormMood.svelte';

    import { pageMetadataStore } from '$lib/components/Header';
    import { goto } from '$app/navigation';

    pageMetadataStore.set({ name: 'Personal Tracker', iconPath: '/personal_tracker.png' });

    const onUpload = () => {
        goto('/personal-tracker');
        toast.push('New entry created');
    };

    let forms = [
        { name: 'mood', component: EventFormMood },
        { name: 'weight', component: EventFormWeight }
    ];
</script>

{#if $user}
    <button onclick={() => goto('/personal-tracker')}>Back</button>

    <h2>Today's Personal Metrics</h2>

    {#each forms as form}
        <form.component {onUpload} />
    {/each}
{:else}
    <Notice item={{ level: 'info', header: 'Login to add an entry or see events' }} />
{/if}
