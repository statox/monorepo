<script lang="ts">
    import { DateTime } from 'luxon';

    interface Props {
        startDate: number;
        endDate: number;
    }

    let { startDate = $bindable(), endDate = $bindable() }: Props = $props();

    // Convert timestamp to date string for input
    const timestampToDateString = (timestamp: number): string => {
        return DateTime.fromMillis(timestamp).toFormat('yyyy-MM-dd');
    };

    // Convert date string to timestamp
    const dateStringToTimestamp = (dateStr: string): number => {
        return DateTime.fromFormat(dateStr, 'yyyy-MM-dd').toMillis();
    };

    // Reactive date strings for inputs
    let startDateStr = $derived(timestampToDateString(startDate));
    let endDateStr = $derived(timestampToDateString(endDate));

    const handleStartChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.value) {
            startDate = dateStringToTimestamp(target.value);
        }
    };

    const handleEndChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.value) {
            endDate = dateStringToTimestamp(target.value);
        }
    };

    const setEndToNow = () => {
        endDate = DateTime.now().startOf('day').toMillis();
    };
</script>

<div class="time-window-picker">
    <div class="date-field">
        <label for="start-date">From</label>
        <input type="date" id="start-date" value={startDateStr} onchange={handleStartChange} />
    </div>

    <div class="date-field">
        <label for="end-date">To</label>
        <div class="end-date-row">
            <input type="date" id="end-date" value={endDateStr} onchange={handleEndChange} />
            <button type="button" onclick={setEndToNow} class="now-btn" title="Set to today">
                Today
            </button>
        </div>
    </div>
</div>

<style>
    .time-window-picker {
        display: flex;
        gap: 1rem;
        align-items: flex-end;
        flex-wrap: wrap;
    }

    .date-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        label {
            font-size: 0.875rem;
            font-weight: 500;
        }

        input[type='date'] {
            padding: 0.5rem;
            border: 1px solid var(--nc-bg-3);
            border-radius: 4px;
            background: var(--nc-bg-2);
            color: var(--nc-tx-1);
        }
    }

    .end-date-row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .now-btn {
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        white-space: nowrap;
    }
</style>
