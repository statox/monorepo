<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { AsyncInterval } from './async-interval.js';
    import { hasRangeChanged, parse, toMillisRange } from './date-math.js';
    import { prettyDuration, showPrettyDuration } from './pretty-duration.js';
    import { commonDurationRanges } from './time-options.js';
    import QuickSelectPopover from './components/QuickSelectPopover.svelte';
    import DatePopoverButton from './components/DatePopoverButton.svelte';
    import UpdateButton from './components/UpdateButton.svelte';
    import type {
        DurationRange,
        Milliseconds,
        OnRefreshChangeProps,
        OnRefreshProps,
        OnTimeChangeProps,
        RefreshUnitsOptions,
        ShortDate
    } from './types.js';

    interface Props {
        start?: ShortDate;
        end?: ShortDate;
        onTimeChange: (props: OnTimeChangeProps) => void;
        onRefresh?: (props: OnRefreshProps) => void;
        onRefreshChange?: (props: OnRefreshChangeProps) => void;
        isPaused?: boolean;
        refreshInterval?: Milliseconds;
        refreshMinInterval?: Milliseconds;
        refreshIntervalUnits?: RefreshUnitsOptions;
        commonlyUsedRanges?: DurationRange[];
        recentlyUsedRanges?: DurationRange[];
        showUpdateButton?: boolean;
        dateFormat?: string;
        isDisabled?: boolean;
    }
    const {
        start: startProp = 'now-15m',
        end: endProp = 'now',
        onTimeChange,
        onRefresh,
        onRefreshChange,
        isPaused = true,
        refreshInterval = 1000,
        refreshMinInterval,
        refreshIntervalUnits,
        commonlyUsedRanges = commonDurationRanges,
        recentlyUsedRanges = [],
        showUpdateButton = true,
        dateFormat = 'MMM d, yyyy @ HH:mm:ss',
        isDisabled = false
    }: Props = $props();

    // Only seeds the initial local state - startProp/endProp changing
    // afterwards should not clobber the user's in-progress selection.
    // svelte-ignore state_referenced_locally
    let start = $state(startProp);
    // svelte-ignore state_referenced_locally
    let end = $state(endProp);
    // svelte-ignore state_referenced_locally
    let committedRange = $state<DurationRange>({ start: startProp, end: endProp });
    const hasChanged = $derived(hasRangeChanged({ start, end }, committedRange));

    const isInvalid = $derived.by(() => {
        if (start === 'now' && end === 'now') return true;
        const startParsed = parse(start);
        const endParsed = parse(end, { roundUp: true });
        if (!startParsed || !endParsed) return true;
        return startParsed > endParsed;
    });

    // svelte-ignore state_referenced_locally
    let showPretty = $state(showPrettyDuration(startProp, endProp, commonlyUsedRanges));

    const setRange = (range: DurationRange) => {
        start = range.start;
        end = range.end;
        if (!showUpdateButton) {
            const millisRange = toMillisRange(start, end);
            if (!millisRange) return;
            committedRange = range;
            onTimeChange({ ...millisRange, start, end, isQuickSelection: false, isInvalid });
        }
    };

    const applyQuickTime = (range: DurationRange) => {
        start = range.start;
        end = range.end;
        showPretty = showPrettyDuration(range.start, range.end, commonlyUsedRanges);
        const millisRange = toMillisRange(range.start, range.end);
        if (!millisRange) return;
        committedRange = range;
        onTimeChange({
            ...millisRange,
            start,
            end,
            isQuickSelection: true,
            isInvalid: false
        });
    };

    const applyTime = () => {
        const millisRange = toMillisRange(start, end);
        if (!millisRange) return;
        onTimeChange({ ...millisRange, start, end, isQuickSelection: false, isInvalid: false });
        committedRange = { start, end };
    };

    const hidePrettyDuration = () => {
        showPretty = false;
    };

    const handleUpdateClick = () => {
        if (!hasChanged && onRefresh) {
            const millisRange = toMillisRange(start, end);
            if (!millisRange) return;
            onRefresh({ ...millisRange, refreshInterval });
        } else {
            applyTime();
        }
    };

    let asyncInterval: AsyncInterval | undefined;

    const stopInterval = () => {
        asyncInterval?.stop();
        asyncInterval = undefined;
    };

    const startInterval = (interval: Milliseconds) => {
        if (!onRefresh) return;
        asyncInterval = new AsyncInterval(() => {
            const millisRange = toMillisRange(start, end);
            if (!millisRange) return;
            onRefresh({ ...millisRange, refreshInterval: interval });
        }, interval);
    };

    onMount(() => {
        if (!isPaused) startInterval(refreshInterval);
    });

    $effect(() => {
        stopInterval();
        if (!isPaused) startInterval(refreshInterval);
    });

    onDestroy(stopInterval);

    const label = $derived(prettyDuration(start, end, { commonlyUsedRanges, dateFormat }));
</script>

<div class="super-date-picker" class:super-date-picker--needs-updating={hasChanged && !isInvalid}>
    <QuickSelectPopover
        {start}
        {end}
        {dateFormat}
        {commonlyUsedRanges}
        {recentlyUsedRanges}
        {isDisabled}
        {isPaused}
        {refreshInterval}
        {refreshMinInterval}
        {refreshIntervalUnits}
        showRefreshInterval={!!onRefreshChange}
        onApplyTime={applyQuickTime}
        {onRefreshChange}
    />

    {#if showPretty}
        <button type="button" class="super-date-picker__pretty" onclick={hidePrettyDuration}>
            {label}
        </button>
    {:else}
        <DatePopoverButton
            value={start}
            {dateFormat}
            {isInvalid}
            {isDisabled}
            onChange={(value) => setRange({ start: value, end })}
        />
        <span class="super-date-picker__delimiter">→</span>
        <DatePopoverButton
            value={end}
            roundUp
            showNowTab
            {dateFormat}
            {isInvalid}
            {isDisabled}
            onChange={(value) => setRange({ start, end: value })}
        />
    {/if}

    {#if showUpdateButton}
        <UpdateButton
            needsUpdate={hasChanged}
            isLoading={false}
            isDisabled={isDisabled || isInvalid}
            onClick={handleUpdateClick}
        />
    {/if}
</div>

<style>
    .super-date-picker {
        display: flex;
        align-items: stretch;
        gap: 6px;
        background-color: var(--nc-bg-3);
        padding: 14px;
        border-radius: 3px;
    }

    .super-date-picker__pretty {
        flex: 1;
        text-align: left;
        padding: 6px 10px;
        background: var(--nc-bg-2);
        border: 1px solid var(--nc-bg-3);
        color: var(--nc-tx-1);
        cursor: pointer;
    }

    .super-date-picker__delimiter {
        display: flex;
        align-items: center;
        color: var(--nc-tx-2);
    }

    .super-date-picker--needs-updating .super-date-picker__pretty {
        border-color: var(--nc-ac-1);
    }
</style>
