<script lang="ts">
    import QuickSelectPanel from './QuickSelectPanel.svelte';
    import RangeLink from './RangeLink.svelte';
    import type { DurationRange } from '../types.js';

    interface Props {
        commonlyUsedRanges: DurationRange[];
        onApply: (range: DurationRange) => void;
    }
    const { commonlyUsedRanges, onApply }: Props = $props();
</script>

<QuickSelectPanel title="Commonly used">
    <ul class="range-grid">
        {#each commonlyUsedRanges as range (range.label)}
            <li>
                <RangeLink onClick={() => onApply(range)}>{range.label}</RangeLink>
            </li>
        {/each}
    </ul>
</QuickSelectPanel>

<style>
    .range-grid {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px 16px;
    }
</style>
