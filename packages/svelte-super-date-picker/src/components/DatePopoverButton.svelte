<script lang="ts">
    import { getDateMode } from '../date-math.js';
    import { prettyDuration } from '../pretty-duration.js';
    import { Popover } from '../popover.svelte.js';
    import AbsoluteTab from './AbsoluteTab.svelte';
    import PopoverPanel from './PopoverPanel.svelte';
    import RelativeTab from './RelativeTab.svelte';
    import type { ShortDate } from '../types.js';

    interface Props {
        value: ShortDate;
        roundUp?: boolean;
        dateFormat: string;
        isInvalid: boolean;
        isDisabled: boolean;
        showNowTab?: boolean;
        onChange: (value: ShortDate) => void;
    }
    const {
        value,
        roundUp = false,
        dateFormat,
        isInvalid,
        isDisabled,
        showNowTab = false,
        onChange
    }: Props = $props();

    const popover = new Popover();
    // Only seeds the initial local state - the active tab shouldn't jump
    // around as the caller-provided value changes while the popover is open.
    // svelte-ignore state_referenced_locally
    let activeTab = $state<'absolute' | 'relative' | 'now'>(getDateMode(value));

    const label = $derived(
        value === 'now'
            ? 'now'
            : prettyDuration(value, 'now', { commonlyUsedRanges: [], dateFormat })
    );

    const handleChange = (nextValue: ShortDate) => {
        onChange(nextValue);
    };

    const selectNow = () => {
        handleChange('now');
        popover.close();
    };
</script>

<svelte:window onclick={popover.handleWindowClick} />

<div class="date-popover-button" bind:this={popover.containerEl}>
    <button
        type="button"
        class="date-popover-button__toggle"
        class:date-popover-button__toggle--invalid={isInvalid}
        disabled={isDisabled}
        onclick={popover.toggle}
    >
        {label}
    </button>

    {#if popover.isOpen}
        <PopoverPanel minWidth="18rem">
            <div class="date-popover-button__tabs">
                <button
                    type="button"
                    class:active={activeTab === 'absolute'}
                    onclick={() => (activeTab = 'absolute')}
                >
                    Absolute
                </button>
                <button
                    type="button"
                    class:active={activeTab === 'relative'}
                    onclick={() => (activeTab = 'relative')}
                >
                    Relative
                </button>
                {#if showNowTab}
                    <button type="button" class:active={activeTab === 'now'} onclick={selectNow}>
                        Now
                    </button>
                {/if}
            </div>
            {#if activeTab === 'absolute'}
                <AbsoluteTab {value} {roundUp} onChange={handleChange} />
            {:else if activeTab === 'relative'}
                <RelativeTab {value} {roundUp} {dateFormat} onChange={handleChange} />
            {/if}
        </PopoverPanel>
    {/if}
</div>

<style>
    .date-popover-button {
        position: relative;
        flex: 1;
    }

    .date-popover-button__toggle {
        width: 100%;
        text-align: left;
        padding: 6px 10px;
        background: var(--nc-bg-2);
        border: 1px solid var(--nc-bg-3);
        color: var(--nc-tx-1);
        cursor: pointer;
    }

    .date-popover-button__toggle--invalid {
        border-color: var(--nc-error);
        color: var(--nc-error);
    }

    .date-popover-button__tabs {
        display: flex;
        border-bottom: 1px solid var(--nc-bg-3);
    }

    .date-popover-button__tabs button {
        flex: 1;
        padding: 6px;
        background: none;
        border: none;
        color: var(--nc-tx-2);
        cursor: pointer;
    }

    .date-popover-button__tabs button.active {
        color: var(--nc-tx-1);
        border-bottom: 2px solid var(--nc-ac-1);
    }
</style>
