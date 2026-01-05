<script lang="ts">
    import { Notice, type NoticeItem } from '$lib/components/Notice';

    interface Props {
        value?: number;
    }

    let { value = $bindable(100) }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);

    export const validate = (): boolean => {
        noticeMessages = [];
        if (value !== Number(value.toFixed(1))) {
            noticeMessages.push({
                level: 'error',
                header: 'Value have at most 1 number after the comma'
            });
        }
        if (value < 80 || value > 110) {
            noticeMessages.push({ level: 'error', header: 'Value must be in kg' });
        }

        return noticeMessages.length === 0;
    };

    export const getStorageValue = (): number => {
        return Math.floor(value * 100);
    };

    const adjustWeight = (delta: number) => {
        value = Number((value + delta).toFixed(1));
    };
</script>

<div class="weight-form">
    {#each noticeMessages as item}
        <Notice {item} />
    {/each}

    <div class="weight-display">
        <div class="value-container">
            <span class="weight-value">{value.toFixed(1)}</span>
            <span class="weight-unit">kg</span>
        </div>
    </div>

    <div class="slider-container">
        <input type="range" min="80" max="110" step="0.1" bind:value class="weight-slider" />
        <div class="slider-labels">
            <span>80 kg</span>
            <span>110 kg</span>
        </div>
    </div>

    <div class="controls">
        <div class="quick-adjust">
            <button onclick={() => adjustWeight(-1)} class="adjust-btn large-dec"> -1 kg </button>
            <button onclick={() => adjustWeight(-0.1)} class="adjust-btn"> -0.1 </button>
            <button onclick={() => adjustWeight(0.1)} class="adjust-btn"> +0.1 </button>
            <button onclick={() => adjustWeight(1)} class="adjust-btn large-inc"> +1 kg </button>
        </div>

        <div class="input-container">
            <label for="weight-input">Direct input:</label>
            <input
                id="weight-input"
                type="number"
                step="0.1"
                min="80"
                max="110"
                bind:value
                class="weight-input"
            />
            <span class="unit-label">kg</span>
        </div>
    </div>
</div>

<style>
    .weight-form {
        display: flex;
        flex-direction: column;
        gap: 1.5em;
    }

    .weight-display {
        text-align: center;
        padding: 1em;
        background-color: var(--nc-bg-2);
        border-radius: 8px;
    }

    .value-container {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 0.5em;
    }

    .weight-value {
        font-size: 3em;
        font-weight: bold;
        line-height: 1;
    }

    .weight-unit {
        font-size: 1.5em;
        opacity: 0.7;
    }

    .slider-container {
        padding: 0 1em;
    }

    .weight-slider {
        width: 100%;
        height: 8px;
        border-radius: 4px;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
        background: var(--nc-bg-3);
    }

    .weight-slider::-webkit-slider-thumb {
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

    .weight-slider::-moz-range-thumb {
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

    .controls {
        display: flex;
        flex-direction: column;
        gap: 1em;
    }

    .quick-adjust {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap: 0.5em;
        padding: 0 0.5em;
    }

    .adjust-btn {
        padding: 0.75em 1em;
        border-radius: 6px;
        border: 2px solid var(--nc-bg-3);
        background-color: var(--nc-bg-1);
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .adjust-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        border-color: var(--nc-ac-1);
    }

    .adjust-btn.large-dec,
    .adjust-btn.large-inc {
        background-color: var(--nc-bg-2);
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

    .weight-input {
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

    .weight-input::-webkit-outer-spin-button,
    .weight-input::-webkit-inner-spin-button {
        display: none;
        -webkit-appearance: none;
        margin: 0;
    }

    .weight-input:focus {
        outline: none;
        border-color: var(--nc-ac-1);
    }

    .unit-label {
        font-weight: bold;
        opacity: 0.7;
    }

    /* Mobile optimization */
    @media (max-width: 768px) {
        .weight-value {
            font-size: 2.5em;
        }

        .weight-unit {
            font-size: 1.2em;
        }

        .quick-adjust {
            grid-template-columns: 1fr 1fr 1fr 1fr;
        }

        .adjust-btn {
            padding: 0.6em 0.5em;
            font-size: 0.9em;
        }
    }

    @media (max-width: 480px) {
        .weight-value {
            font-size: 2em;
        }

        .quick-adjust {
            grid-template-columns: 1fr 1fr;
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

        .weight-input {
            width: 100%;
        }
    }
</style>
