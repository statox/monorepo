<script lang="ts">
    import { Notice, type NoticeItem } from '$lib/components/Notice';

    interface Props {
        value?: number;
    }

    let { value = $bindable(5) }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);

    // Mood labels with emojis for better UX
    const moodEmojis = ['😢', '😟', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '😍'];
    const moodLabels = [
        'Terrible',
        'Very Bad',
        'Bad',
        'Poor',
        'Okay',
        'Good',
        'Great',
        'Very Good',
        'Excellent',
        'Amazing'
    ];

    // Color gradient from red (1) to green (10)
    const getMoodColor = (mood: number) => {
        const colors = [
            '#d32f2f', // 1 - Red
            '#e53935',
            '#f44336', // 3
            '#ff5722',
            '#ff9800', // 5 - Orange
            '#ffc107',
            '#ffeb3b', // 7 - Yellow
            '#cddc39',
            '#8bc34a', // 9
            '#4caf50' // 10 - Green
        ];
        return colors[mood - 1];
    };
</script>

<div class="mood-form">
    {#each noticeMessages as item}
        <Notice {item} />
    {/each}

    <div class="current-mood">
        <div class="mood-display">
            <span class="mood-emoji">{moodEmojis[value - 1]}</span>
            <span class="mood-value">{value}</span>
            <span class="mood-label">{moodLabels[value - 1]}</span>
        </div>
    </div>

    <div class="mood-slider-container">
        <input
            type="range"
            min="1"
            max="10"
            step="1"
            bind:value
            class="mood-slider"
            style="--mood-color: {getMoodColor(value)}"
        />
        <div class="slider-labels">
            <span>1</span>
            <span>10</span>
        </div>
    </div>

    <div class="mood-buttons">
        {#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as mood}
            <button
                class="mood-button"
                class:selected={value === mood}
                onclick={() => (value = mood)}
                style="--mood-color: {getMoodColor(mood)}"
                title="{mood} - {moodLabels[mood - 1]}"
            >
                <span class="emoji">{moodEmojis[mood - 1]}</span>
                <span class="number">{mood}</span>
            </button>
        {/each}
    </div>
</div>

<style>
    .mood-form {
        display: flex;
        flex-direction: column;
        gap: 1.5em;
    }

    .current-mood {
        text-align: center;
    }

    .mood-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5em;
        padding: 1em;
        background-color: var(--nc-bg-2);
        border-radius: 8px;
    }

    .mood-emoji {
        font-size: 3em;
        line-height: 1;
    }

    .mood-value {
        font-size: 2em;
        font-weight: bold;
    }

    .mood-label {
        font-size: 1.2em;
        opacity: 0.8;
    }

    .mood-slider-container {
        padding: 0 1em;
    }

    .mood-slider {
        width: 100%;
        height: 8px;
        border-radius: 4px;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
        background: linear-gradient(
            to right,
            #d32f2f 0%,
            #ff5722 25%,
            #ff9800 50%,
            #cddc39 75%,
            #4caf50 100%
        );
    }

    .mood-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--mood-color);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        cursor: pointer;
    }

    .mood-slider::-moz-range-thumb {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--mood-color);
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

    .mood-buttons {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.75em;
        padding: 0 0.5em;
    }

    .mood-button {
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

    .mood-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        border-color: var(--mood-color);
    }

    .mood-button.selected {
        background-color: var(--mood-color);
        border-color: var(--mood-color);
        color: white;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .mood-button .emoji {
        font-size: 1.5em;
        line-height: 1;
    }

    .mood-button .number {
        font-size: 0.9em;
        font-weight: bold;
    }

    .mood-button.selected .number {
        color: white;
    }

    /* Mobile optimization */
    @media (max-width: 768px) {
        .mood-emoji {
            font-size: 2.5em;
        }

        .mood-value {
            font-size: 1.5em;
        }

        .mood-buttons {
            grid-template-columns: repeat(5, 1fr);
            gap: 0.5em;
        }

        .mood-button {
            padding: 0.5em 0.25em;
        }

        .mood-button .emoji {
            font-size: 1.2em;
        }

        .mood-button .number {
            font-size: 0.8em;
        }
    }

    @media (max-width: 480px) {
        .mood-buttons {
            grid-template-columns: repeat(5, 1fr);
            gap: 0.4em;
        }

        .mood-button .emoji {
            font-size: 1em;
        }
    }
</style>
