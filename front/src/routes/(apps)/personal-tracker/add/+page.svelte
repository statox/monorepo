<script lang="ts">
    import { toast } from '$lib/components/Toast';
    import { user } from '$lib/auth';
    import { Notice } from '$lib/components/Notice';
    import EventFormWeight from '../components/EventFormWeight.svelte';
    import EventFormMood from '../components/EventFormMood.svelte';

    import { pageNameStore } from '$lib/components/Header';
    import { goto } from '$app/navigation';

    pageNameStore.set('Personal Tracker');

    const onUpload = () => {
        goto('/personal-tracker');
        toast.push('New entry created');
    };

    let forms = [
        { name: 'mood', component: EventFormMood },
        { name: 'weight', component: EventFormWeight }
    ];

    let currentForm = $state(forms[0]);
</script>

{#if $user}
    <button onclick={() => goto('/personal-tracker')}>Back</button>

    <select bind:value={currentForm}>
        {#each forms as form}
            <option value={form}>{form.name}</option>
        {/each}
    </select>

    <currentForm.component {onUpload} />
{:else}
    <Notice item={{ level: 'info', header: 'Login to add an entry or see events' }} />
{/if}
