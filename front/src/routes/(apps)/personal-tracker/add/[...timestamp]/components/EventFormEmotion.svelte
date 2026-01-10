<script lang="ts">
    import { SvelteSet } from 'svelte/reactivity';
    import EventFormEmotionList from './EventFormEmotionList.svelte';
    import EventFormEmotionWheel from './EventFormEmotionWheel.svelte';
    import EventFormEmotionSelection from './EventFormEmotionSelection.svelte';
    import { onMount } from 'svelte';

    interface Props {
        selection: SvelteSet<string>;
    }
    let { selection }: Props = $props();

    // View mode toggle (default to list on mobile)
    let viewMode = $state<'wheel' | 'list'>('wheel');

    onMount(() => {
        // Default to list view on mobile devices
        if (window.innerWidth < 768) {
            viewMode = 'list';
        }
    });

    export const getEmotionsData = () => {
        return [...selection].map((item) => {
            const [category, subcategory, emotion, color] = item.split(' - ');
            return {
                category,
                subcategory,
                emotion,
                color
            };
        });
    };
</script>

<div class="emotion-form">
    <div class="view-toggle">
        <button
            class="toggle-btn"
            class:active={viewMode === 'wheel'}
            onclick={() => (viewMode = 'wheel')}
        >
            🎯 Wheel View
        </button>
        <button
            class="toggle-btn"
            class:active={viewMode === 'list'}
            onclick={() => (viewMode = 'list')}
        >
            📋 List View
        </button>
    </div>

    {#if viewMode === 'list'}
        <EventFormEmotionList {selection} />
    {:else}
        <EventFormEmotionWheel {selection} />
    {/if}
    <EventFormEmotionSelection {selection} />
</div>

<style>
    .emotion-form {
        display: flex;
        flex-direction: column;
        gap: 1em;
    }

    .view-toggle {
        display: flex;
        gap: 0.5em;
        padding: 0.5em;
        background-color: var(--nc-bg-2);
        border-radius: 8px;
    }

    .toggle-btn {
        flex: 1;
        padding: 0.75em 1em;
        border-radius: 6px;
        border: 2px solid var(--nc-bg-3);
        background-color: var(--nc-bg-1);
        color: var(--nc-tx-1);
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: bold;
    }

    .toggle-btn:hover {
        border-color: var(--nc-ac-1);
        transform: translateY(-1px);
    }

    .toggle-btn.active {
        background-color: var(--nc-ac-1);
        border-color: var(--nc-ac-1);
        color: white;
    }
</style>
