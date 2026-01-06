<script lang="ts">
    import { Notice, type NoticeItem } from '$lib/components/Notice';

    interface Props {
        value?: number;
    }

    let { value = $bindable(5) }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);

    // Energy labels with emojis
    const energyEmojis = ['😴', '😪', '🥱', '😑', '😐', '🙂', '😊', '😄', '⚡', '🔋'];
    const energyLabels = [
        'Exhausted',
        'Very Tired',
        'Tired',
        'Drained',
        'Low',
        'Moderate',
        'Good',
        'Energetic',
        'Vibrant',
        'Peak Energy'
    ];

    // Color gradient from red/purple (1) to bright green/blue (10)
    const getEnergyColor = (energy: number) => {
        const colors = [
            '#8e24aa', // 1 - Purple (exhausted)
            '#d32f2f', // 2 - Red (very tired)
            '#f44336', // 3 - Light red (tired)
            '#ff5722', // 4 - Orange-red (drained)
            '#ff9800', // 5 - Orange (low)
            '#ffc107', // 6 - Amber (moderate)
            '#cddc39', // 7 - Lime (good)
            '#8bc34a', // 8 - Light green (energetic)
            '#4caf50', // 9 - Green (vibrant)
            '#00bcd4'  // 10 - Cyan (peak energy)
        ];
        return colors[energy - 1];
    };
</script>

<div class="energy-form">
    {#each noticeMessages as item}
        <Notice {item} />
    {/each}

    <div class="current-energy">
        <div class="energy-display">
            <span class="energy-emoji">{energyEmojis[value - 1]}</span>
            <span class="energy-value">{value}</span>
            <span class="energy-label">{energyLabels[value - 1]}</span>
        </div>
    </div>

    <div class="energy-slider-container">
        <input
            type="range"
            min="1"
            max="10"
            step="1"
            bind:value
            class="energy-slider"
            style="--energy-color: {getEnergyColor(value)}"
        />
        <div class="slider-labels">
            <span>1</span>
            <span>10</span>
        </div>
    </div>

    <div class="energy-buttons">
        {#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as energy}
            <button
                class="energy-button"
                class:selected={value === energy}
                onclick={() => (value = energy)}
                style="--energy-color: {getEnergyColor(energy)}"
                title="{energy} - {energyLabels[energy - 1]}"
            >
                <span class="emoji">{energyEmojis[energy - 1]}</span>
                <span class="number">{energy}</span>
            </button>
        {/each}
    </div>
</div>

<style>
    .energy-form {
        display: flex;
        flex-direction: column;
        gap: 1.5em;
    }

    .current-energy {
        text-align: center;
    }

    .energy-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5em;
        padding: 1em;
        background-color: var(--nc-bg-2);
        border-radius: 8px;
    }

    .energy-emoji {
        font-size: 3em;
        line-height: 1;
    }

    .energy-value {
        font-size: 2em;
        font-weight: bold;
    }

    .energy-label {
        font-size: 1.2em;
        opacity: 0.8;
    }

    .energy-slider-container {
        padding: 0 1em;
    }

    .energy-slider {
        width: 100%;
        height: 8px;
        border-radius: 4px;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
        background: linear-gradient(
            to right,
            #8e24aa 0%,
            #d32f2f 10%,
            #ff5722 30%,
            #ff9800 50%,
            #cddc39 70%,
            #4caf50 90%,
            #00bcd4 100%
        );
    }

    .energy-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--energy-color);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        cursor: pointer;
    }

    .energy-slider::-moz-range-thumb {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--energy-color);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        cursor: pointer;
    }

    .slider-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 0.5em;
        font-size: 0.9em;
        opacity: 0.7;
    }

    .energy-buttons {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.75em;
        padding: 0 0.5em;
    }

    .energy-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25em;
        padding: 0.75em 0.5em;
        border: 2px solid var(--nc-bg-3);
        border-radius: 8px;
        background-color: var(--nc-bg-1);
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .energy-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        border-color: var(--energy-color);
    }

    .energy-button.selected {
        background-color: var(--energy-color);
        border-color: var(--energy-color);
        color: white;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .energy-button .emoji {
        font-size: 1.5em;
        line-height: 1;
    }

    .energy-button .number {
        font-size: 0.9em;
        font-weight: bold;
    }

    .energy-button.selected .number {
        color: white;
    }

    /* Mobile optimization */
    @media (max-width: 768px) {
        .energy-emoji {
            font-size: 2.5em;
        }

        .energy-value {
            font-size: 1.5em;
        }

        .energy-buttons {
            grid-template-columns: repeat(5, 1fr);
            gap: 0.5em;
        }

        .energy-button {
            padding: 0.5em 0.25em;
        }

        .energy-button .emoji {
            font-size: 1.2em;
        }

        .energy-button .number {
            font-size: 0.8em;
        }
    }

    @media (max-width: 480px) {
        .energy-buttons {
            grid-template-columns: repeat(5, 1fr);
            gap: 0.4em;
        }

        .energy-button .emoji {
            font-size: 1em;
        }
    }
</style>
