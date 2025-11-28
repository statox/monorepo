<script lang="ts">
    import { toast } from '$lib/components/Toast';
    import { user } from '$lib/auth';
    import { Notice } from '$lib/components/Notice';
    import EventFormWeight from '../components/EventFormWeight.svelte';
    import EventFormMood from '../components/EventFormMood.svelte';

    import { pageMetadataStore } from '$lib/components/Header';
    import { goto } from '$app/navigation';

    pageMetadataStore.set({
        name: 'Personal Tracker',
        iconPath: '/personal_tracker.png',
        showAuthInHeader: true
    });

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
    <div class="contents">
        <h4 class="title-bar">
            Today's Personal Metrics
            <button
                onclick={() => {
                    goto('/personal-tracker');
                }}>Back</button
            >
        </h4>

        {#each forms as form}
            <form.component {onUpload} />
            <hr class="separator" />
        {/each}
    </div>
{:else}
    <Notice item={{ level: 'info', header: 'Login to add an entry or see events' }} />
{/if}

<style>
    .contents {
        min-width: 240px;
        padding: 16px;
    }
    .title-bar {
        margin-bottom: 1em;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }
    .separator {
        height: 2px;
        border: none;
        background-color: var(--nc-bg-3);
        margin: 1em 0;
    }
</style>
