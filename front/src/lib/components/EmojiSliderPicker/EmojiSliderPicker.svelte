<script lang="ts">
    import { Notice, type NoticeItem } from '$lib/components/Notice';

    export interface EmojiSliderOption {
        value: number;
        emoji: string;
        label: string;
    }

    interface Props {
        value?: number;
        options: EmojiSliderOption[];
        colorPalette?: string[];
    }

    let { value = $bindable(5), options, colorPalette }: Props = $props();

    const min = $derived(Math.min(...options.map((o) => o.value)));
    const max = $derived(Math.max(...options.map((o) => o.value)));

    // Validate options continuity
    const validateOptions = () => {
        const errors: NoticeItem[] = [];

        if (options.length === 0) {
            errors.push({
                level: 'error',
                header: 'No options provided',
                message: 'At least one option is required'
            });
            return errors;
        }

        if (options.length !== colors().length) {
            errors.push({
                level: 'error',
                header: 'Invalid number of colors',
                message: 'The same number of colors and options must be passed to the component'
            });
            return errors;
        }

        // Check for continuous values
        const values = options.map((o) => o.value).sort((a, b) => a - b);
        for (let i = 1; i < values.length; i++) {
            if (values[i] !== values[i - 1] + 1) {
                errors.push({
                    level: 'error',
                    header: 'Non-continuous values',
                    message: `Option values must be continuous. Gap found between ${values[i - 1]} and ${values[i]}`
                });
                break;
            }
        }

        return errors;
    };

    // Generate color palette dynamically based on number of options
    const generateColorPalette = (numColors: number): string[] => {
        if (numColors < 2) return ['#4caf50'];

        // Generate gradient from red to green
        const colors: string[] = [];
        for (let i = 0; i < numColors; i++) {
            const ratio = i / (numColors - 1);

            // Interpolate between red (0, low) and green (1, high)
            let r, g, b;
            if (ratio < 0.5) {
                // Red to Yellow (red stays high, green increases)
                r = 211;
                g = Math.round(47 + 193 * (ratio * 2)); // 47 to 240
                b = 47;
            } else {
                // Yellow to Green (red decreases, green stays high)
                r = Math.round(211 - 135 * ((ratio - 0.5) * 2)); // 211 to 76
                g = 240;
                b = 47 + Math.round(3 * ((ratio - 0.5) * 2)); // slight adjustment
            }

            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            colors.push(hex);
        }

        return colors;
    };

    // Use provided palette or generate one
    const colors = $derived(() => {
        if (colorPalette) {
            return colorPalette;
        }
        return generateColorPalette(options.length);
    });

    // Validation and computed values
    let validationErrors: NoticeItem[] = $derived.by(() => validateOptions());

    // Get color for a specific value
    const getColor = (val: number) => {
        const index = val - min;
        return colors()[index] || colors()[0];
    };

    // Generate gradient for slider background
    const sliderGradient = $derived(() => {
        const colorArray = colors();
        if (colorArray.length < 2) return colorArray[0] || '#ccc';

        const stops = colorArray.map((color, index) => {
            const percentage = (index / (colorArray.length - 1)) * 100;
            return `${color} ${percentage}%`;
        });

        return `linear-gradient(to right, ${stops.join(', ')})`;
    });
</script>

<div class="emoji-slider-picker">
    {#each validationErrors as error}
        <Notice item={error} />
    {/each}

    {#if validationErrors.length === 0}
        <div class="current-display">
            <div class="value-display">
                <span class="value-emoji">{options[value - min]?.emoji || ''}</span>
                <span class="value-number">{value}</span>
                <span class="value-label">{options[value - min]?.label || ''}</span>
            </div>
        </div>

        <div class="slider-container">
            <input
                type="range"
                {min}
                {max}
                step="1"
                bind:value
                class="slider"
                style="--current-color: {getColor(value)}; --slider-gradient: {sliderGradient()}"
            />
            <div class="slider-labels">
                <span>{min}</span>
                <span>{max}</span>
            </div>
        </div>

        <div class="buttons-grid" style="--grid-columns: {Math.min(5, options.length)}">
            {#each options as option}
                <button
                    class="option-button"
                    class:selected={value === option.value}
                    onclick={() => (value = option.value)}
                    style="--option-color: {getColor(option.value)}"
                    title="{option.value} - {option.label}"
                >
                    <span class="emoji">{option.emoji}</span>
                    <span class="number">{option.value}</span>
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .emoji-slider-picker {
        display: flex;
        flex-direction: column;
        gap: 1.5em;
    }

    .current-display {
        text-align: center;
    }

    .value-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5em;
        padding: 1em;
        background-color: var(--nc-bg-2);
        border-radius: 8px;
    }

    .value-emoji {
        font-size: 3em;
        line-height: 1;
    }

    .value-number {
        font-size: 2em;
        font-weight: bold;
    }

    .value-label {
        font-size: 1.2em;
        opacity: 0.8;
    }

    .slider-container {
        padding: 0 1em;
    }

    .slider {
        width: 100%;
        height: 8px;
        border-radius: 4px;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
        background: var(--slider-gradient);
    }

    .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--current-color);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        cursor: pointer;
    }

    .slider::-moz-range-thumb {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--current-color);
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

    .buttons-grid {
        display: grid;
        grid-template-columns: repeat(var(--grid-columns, 5), 1fr);
        gap: 0.75em;
        padding: 0 0.5em;
    }

    .option-button {
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

    .option-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        border-color: var(--option-color);
    }

    .option-button.selected {
        background-color: var(--option-color);
        border-color: var(--option-color);
        color: white;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .option-button .emoji {
        font-size: 1.5em;
        line-height: 1;
    }

    .option-button .number {
        font-size: 0.9em;
        font-weight: bold;
    }

    .option-button.selected .number {
        color: white;
    }

    /* Mobile optimization */
    @media (max-width: 768px) {
        .value-emoji {
            font-size: 2.5em;
        }

        .value-number {
            font-size: 1.5em;
        }

        .buttons-grid {
            gap: 0.5em;
        }

        .option-button {
            padding: 0.5em 0.25em;
        }

        .option-button .emoji {
            font-size: 1.2em;
        }

        .option-button .number {
            font-size: 0.8em;
        }
    }

    @media (max-width: 480px) {
        .buttons-grid {
            gap: 0.4em;
        }

        .option-button .emoji {
            font-size: 1em;
        }
    }
</style>
