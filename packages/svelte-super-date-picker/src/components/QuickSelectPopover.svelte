<script lang="ts">
    import { Popover } from '../popover.svelte.js';
    import QuickSelect from './QuickSelect.svelte';
    import CommonlyUsedRanges from './CommonlyUsedRanges.svelte';
    import PopoverPanel from './PopoverPanel.svelte';
    import RecentlyUsedRanges from './RecentlyUsedRanges.svelte';
    import RefreshIntervalControl from './RefreshIntervalControl.svelte';
    import type {
        DurationRange,
        Milliseconds,
        OnRefreshChangeProps,
        RefreshUnitsOptions
    } from '../types.js';

    interface Props {
        start: string;
        end: string;
        dateFormat: string;
        commonlyUsedRanges: DurationRange[];
        recentlyUsedRanges: DurationRange[];
        isDisabled: boolean;
        isPaused: boolean;
        refreshInterval: Milliseconds;
        refreshMinInterval?: Milliseconds;
        refreshIntervalUnits?: RefreshUnitsOptions;
        showRefreshInterval: boolean;
        onApplyTime: (range: DurationRange) => void;
        onRefreshChange?: (props: OnRefreshChangeProps) => void;
    }
    const {
        start,
        end,
        dateFormat,
        commonlyUsedRanges,
        recentlyUsedRanges,
        isDisabled,
        isPaused,
        refreshInterval,
        refreshMinInterval,
        refreshIntervalUnits,
        showRefreshInterval,
        onApplyTime,
        onRefreshChange
    }: Props = $props();

    const popover = new Popover();

    const applyTime = (range: DurationRange) => {
        onApplyTime(range);
        popover.close();
    };
</script>

<svelte:window onclick={popover.handleWindowClick} />

<div class="quick-select-popover" bind:this={popover.containerEl}>
    <button
        type="button"
        class="quick-select-popover__toggle"
        disabled={isDisabled}
        onclick={popover.toggle}
        aria-label="Date quick select"
    >
        <i class="far fa-calendar-alt"></i>
        <i class="fas fa-caret-down"></i>
    </button>

    {#if popover.isOpen}
        <PopoverPanel minWidth="20rem" padding="12px" alignLeft>
            <QuickSelect {start} {end} onApply={applyTime} />
            <CommonlyUsedRanges {commonlyUsedRanges} onApply={applyTime} />
            <RecentlyUsedRanges
                {recentlyUsedRanges}
                {commonlyUsedRanges}
                {dateFormat}
                onApply={applyTime}
            />
            {#if showRefreshInterval && onRefreshChange}
                <RefreshIntervalControl
                    {isPaused}
                    {refreshInterval}
                    minInterval={refreshMinInterval}
                    intervalUnits={refreshIntervalUnits}
                    {onRefreshChange}
                />
            {/if}
        </PopoverPanel>
    {/if}
</div>

<style>
    .quick-select-popover {
        position: relative;
    }

    .quick-select-popover__toggle {
        display: flex;
        align-items: center;
        gap: 4px;
        height: 100%;
        padding: 0 8px;
        background: var(--nc-bg-2);
        border: 1px solid var(--nc-bg-3);
        color: var(--nc-tx-1);
        cursor: pointer;
    }
</style>
