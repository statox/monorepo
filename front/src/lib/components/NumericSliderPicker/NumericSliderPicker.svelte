<script lang="ts">
    import { Notice, type NoticeItem } from '$lib/components/Notice';

    interface Props {
        value?: number;
        min: number;
        max: number;
        step?: number;
        unit?: string;
        decimals?: number;
        adjustmentButtons?: number[];
        showSlider?: boolean;
        showDirectInput?: boolean;
        validate?: (value: number) => NoticeItem[];
    }

    let {
        value = $bindable(0),
        min,
        max,
        step = 1,
        unit = '',
        decimals = 0,
        adjustmentButtons = [],
        showSlider = true,
        showDirectInput = true,
        validate
    }: Props = $props();

    // Validation
    const validationErrors = $derived(() => {
        if (validate) {
            return validate(value);
        }
        return [];
    });

    // Adjust value by a delta
    const adjustValue = (delta: number) => {
        const newValue = value + delta;
        value = Math.max(min, Math.min(max, newValue));
        if (decimals) {
            value = Number(formatValue(value));
        }
    };

    // Format display value
    const formatValue = (val: number) => {
        return val.toFixed(decimals);
    };
</script>

<div class="numeric-slider-picker">
    {#each validationErrors() as error}
        <Notice item={error} />
    {/each}

    <div class="value-display">
        <div class="display-container">
            <span class="value-number">{formatValue(value)}</span>
            {#if unit}
                <span class="value-unit">{unit}</span>
            {/if}
        </div>
    </div>

    {#if showSlider}
        <div class="slider-container">
            <input type="range" {min} {max} {step} bind:value class="value-slider" />
            <div class="slider-labels">
                <span>{formatValue(min)}{unit ? ` ${unit}` : ''}</span>
                <span>{formatValue(max)}{unit ? ` ${unit}` : ''}</span>
            </div>
        </div>
    {/if}

    {#if adjustmentButtons.length > 0}
        <div class="adjustment-buttons">
            {#each adjustmentButtons as delta}
                <button class="adjust-btn" onclick={() => adjustValue(delta)}>
                    {delta > 0 ? '+' : ''}{formatValue(delta)}
                </button>
            {/each}
        </div>
    {/if}

    {#if showDirectInput}
        <div class="input-container">
            <label for="numeric-input">Direct input:</label>
            <input
                id="numeric-input"
                type="number"
                {step}
                {min}
                {max}
                bind:value
                class="numeric-input"
            />
            {#if unit}
                <span class="unit-label">{unit}</span>
            {/if}
        </div>
    {/if}
</div>

<style>
    .numeric-slider-picker {
        display: flex;
        flex-direction: column;
        gap: 1.5em;
    }

    .value-display {
        text-align: center;
        padding: 1em;
        background-color: var(--nc-bg-2);
        border-radius: 8px;
    }

    .display-container {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 0.5em;
    }

    .value-number {
        font-size: 3em;
        font-weight: bold;
        line-height: 1;
    }

    .value-unit {
        font-size: 1.5em;
        opacity: 0.7;
    }

    .slider-container {
        padding: 0 1em;
    }

    .value-slider {
        width: 100%;
        height: 8px;
        border-radius: 4px;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
        background: var(--nc-bg-3);
    }

    .value-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--nc-ac-1);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        cursor: pointer;
    }

    .value-slider::-moz-range-thumb {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--nc-ac-1);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        border: none;
    }

    .slider-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 0.5em;
        font-size: 0.9em;
        opacity: 0.7;
    }

    .adjustment-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
        gap: 0.5em;
        padding: 0 0.5em;
    }

    .adjust-btn {
        padding: 0.75em 1em;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .adjust-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        border-color: var(--nc-ac-1);
    }

    .input-container {
        display: flex;
        align-items: center;
        gap: 0.75em;
        padding: 0 0.5em;
        flex-wrap: wrap;
    }

    .input-container label {
        font-weight: bold;
        font-size: 0.95em;
    }

    .numeric-input {
        flex: 1;
        min-width: 100px;
        padding: 0.75em;
        font-size: 1.1em;
        text-align: center;
        border-radius: 6px;
        border: 2px solid var(--nc-bg-3);
        background-color: var(--nc-bg-1);

        /* Disable built-in arrows */
        -moz-appearance: textfield;
        appearance: textfield;
    }

    .numeric-input::-webkit-outer-spin-button,
    .numeric-input::-webkit-inner-spin-button {
        display: none;
        -webkit-appearance: none;
        margin: 0;
    }

    .numeric-input:focus {
        outline: none;
        border-color: var(--nc-ac-1);
    }

    .unit-label {
        font-weight: bold;
        opacity: 0.7;
    }

    /* Mobile optimization */
    @media (max-width: 768px) {
        .value-number {
            font-size: 2.5em;
        }

        .value-unit {
            font-size: 1.2em;
        }

        .adjustment-buttons {
            grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
        }

        .adjust-btn {
            padding: 0.6em 0.5em;
            font-size: 0.9em;
        }
    }

    @media (max-width: 480px) {
        .value-number {
            font-size: 2em;
        }

        .adjustment-buttons {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.4em;
        }

        .adjust-btn {
            padding: 0.5em 0.4em;
            font-size: 0.85em;
        }

        .input-container {
            flex-direction: column;
            align-items: stretch;
        }

        .numeric-input {
            width: 100%;
        }
    }
</style>
