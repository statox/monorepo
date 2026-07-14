<script lang="ts">
    import QuickSelectPanel from './QuickSelectPanel.svelte';
    import RangeLink from './RangeLink.svelte';
    import { prettyDuration } from '../pretty-duration.js';
    import type { DurationRange } from '../types.js';

    interface Props {
        recentlyUsedRanges: DurationRange[];
        commonlyUsedRanges: DurationRange[];
        dateFormat: string;
        onApply: (range: DurationRange) => void;
    }
    const { recentlyUsedRanges, commonlyUsedRanges, dateFormat, onApply }: Props = $props();
</script>

{#if recentlyUsedRanges.length > 0}
    <QuickSelectPanel title="Recently used date ranges">
        <ul class="range-list">
            {#each recentlyUsedRanges as range (`${range.start}-${range.end}`)}
                <li>
                    <RangeLink onClick={() => onApply(range)}>
                        {prettyDuration(range.start, range.end, {
                            commonlyUsedRanges,
                            dateFormat
                        })}
                    </RangeLink>
                </li>
            {/each}
        </ul>
    </QuickSelectPanel>
{/if}

<style>
    .range-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
</style>
