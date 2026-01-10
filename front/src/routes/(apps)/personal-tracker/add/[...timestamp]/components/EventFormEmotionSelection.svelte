<script lang="ts">
    import { SvelteSet } from 'svelte/reactivity';

    interface Props {
        selection: SvelteSet<string>;
    }
    let { selection }: Props = $props();
</script>

<div class="selection-display">
    <h5>Selected Emotions:</h5>
    {#if selection.size === 0}
        <p class="no-selection">No emotions selected yet</p>
    {:else}
        <div class="selected-items">
            {#each [...selection] as item}
                {@const [emotion, color] = item.split(' - ').slice(2)}
                <button
                    class="selected-item"
                    style="--color: {color}"
                    onclick={() => selection.delete(item)}
                >
                    <span class="emotion-text">{emotion}</span>
                    <span class="remove-icon">×</span>
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .selection-display {
        margin-top: 1.5em;
        padding: 1em;
        background-color: var(--nc-bg-2);
        border-radius: 8px;
    }

    .selection-display h5 {
        margin: 0 0 0.75em 0;
        font-size: 1em;
    }

    .no-selection {
        margin: 0;
        opacity: 0.6;
        font-style: italic;
    }

    .selected-items {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5em;
    }

    .selected-item {
        display: flex;
        align-items: center;
        gap: 0.5em;
        padding: 0.5em 0.75em;
        border-radius: 20px;
        background-color: var(--color);
        color: white;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .selected-item:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .emotion-text {
        font-weight: bold;
    }

    .remove-icon {
        font-size: 1.5em;
        line-height: 1;
        opacity: 0.8;
    }
</style>
