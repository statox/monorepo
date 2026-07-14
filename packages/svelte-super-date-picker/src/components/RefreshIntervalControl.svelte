<script lang="ts">
    import QuickSelectPanel from './QuickSelectPanel.svelte';
    import {
        clampToMinInterval,
        fromMilliseconds,
        getMinInterval,
        resolveIsPaused,
        toMilliseconds
    } from '../refresh-interval-utils.js';
    import { refreshUnitsOptions } from '../time-options.js';
    import type { Milliseconds, OnRefreshChangeProps, RefreshUnitsOptions } from '../types.js';

    interface Props {
        isPaused: boolean;
        refreshInterval: Milliseconds;
        minInterval?: Milliseconds;
        intervalUnits?: RefreshUnitsOptions;
        onRefreshChange: (props: OnRefreshChangeProps) => void;
    }
    const {
        isPaused,
        refreshInterval,
        minInterval = 0,
        intervalUnits,
        onRefreshChange
    }: Props = $props();

    // Only seeds the initial local state - refreshInterval changing afterwards
    // should not reset the user's in-progress edit.
    // svelte-ignore state_referenced_locally
    const initial = fromMilliseconds(refreshInterval, intervalUnits);
    let value = $state<number | ''>(initial.value);
    let units = $state<RefreshUnitsOptions>(initial.units);
    let min = $derived(getMinInterval(minInterval, units));

    const apply = () => {
        if (value === '') return;
        const refreshIntervalMs = clampToMinInterval(toMilliseconds(units, value), minInterval);
        onRefreshChange({
            refreshInterval: refreshIntervalMs,
            intervalUnits: units,
            isPaused: resolveIsPaused(refreshIntervalMs, isPaused)
        });
    };

    const onValueInput = (event: Event) => {
        const raw = parseFloat((event.target as HTMLInputElement).value);
        value = isNaN(raw) ? '' : raw;
        apply();
    };

    const onUnitsChange = () => {
        apply();
    };

    const toggle = () => {
        if (value === '') return;
        const refreshIntervalMs = clampToMinInterval(toMilliseconds(units, value), minInterval);
        onRefreshChange({
            refreshInterval: refreshIntervalMs,
            intervalUnits: units,
            isPaused: resolveIsPaused(refreshIntervalMs, !isPaused)
        });
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Enter') toggle();
    };
</script>

<QuickSelectPanel>
    <div class="refresh-interval">
        <label class="refresh-interval__toggle">
            <input type="checkbox" checked={!isPaused} onchange={toggle} />
            Refresh every
        </label>
        <input
            type="number"
            {min}
            {value}
            disabled={isPaused}
            oninput={onValueInput}
            onkeydown={handleKeydown}
            aria-label="Refresh interval value"
        />
        <select
            bind:value={units}
            disabled={isPaused}
            onchange={onUnitsChange}
            onkeydown={handleKeydown}
            aria-label="Refresh interval units"
        >
            {#each refreshUnitsOptions as option (option.value)}
                <option value={option.value}>{option.text}</option>
            {/each}
        </select>
    </div>
</QuickSelectPanel>

<style>
    .refresh-interval {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .refresh-interval__toggle {
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
    }

    .refresh-interval input[type='number'] {
        width: 4rem;
    }
</style>
