<script lang="ts">
    import { NumericSliderPicker } from '$lib/components/NumericSliderPicker';
    import type { NoticeItem } from '$lib/components/Notice';

    // Weight example with validation
    let weight = $state(70);
    const validateWeight = (val: number): NoticeItem[] => {
        const errors: NoticeItem[] = [];
        if (val !== Number(val.toFixed(1))) {
            errors.push({
                level: 'error',
                header: 'Maximum 1 decimal place allowed'
            });
        }
        if (val < 40 || val > 200) {
            errors.push({
                level: 'error',
                header: 'Weight must be between 40 and 200 kg'
            });
        }
        return errors;
    };

    // Temperature example
    let temperature = $state(20);

    // Percentage example - no slider, no buttons
    let percentage = $state(75);
</script>

<div class="demo-container">
    <h2>NumericSliderPicker Examples</h2>

    <div class="example-section">
        <h3>1. Weight Tracker (With Validation)</h3>
        <p>Slider + adjustment buttons + direct input with custom validation</p>
        <div class="picker-wrapper">
            <NumericSliderPicker
                bind:value={weight}
                min={40}
                max={200}
                step={0.1}
                unit="kg"
                decimals={1}
                adjustmentButtons={[-5, -1, -0.1, 0.1, 1, 5]}
                validate={validateWeight}
            />
        </div>
        <p class="value-display">Current weight: {weight.toFixed(1)} kg</p>
    </div>

    <div class="example-section">
        <h3>2. Temperature Control</h3>
        <p>Full-featured temperature picker with decimal precision</p>
        <div class="picker-wrapper">
            <NumericSliderPicker
                bind:value={temperature}
                min={15}
                max={30}
                step={0.5}
                unit="°C"
                decimals={1}
                adjustmentButtons={[-2, -0.5, 0.5, 2]}
            />
        </div>
        <p class="value-display">Current temperature: {temperature.toFixed(1)}°C</p>
    </div>

    <div class="example-section">
        <h3>3. Percentage (Minimal - Input Only)</h3>
        <p>Just the display and direct input field, no slider or buttons</p>
        <div class="picker-wrapper">
            <NumericSliderPicker
                bind:value={percentage}
                min={0}
                max={100}
                step={1}
                unit="%"
                decimals={0}
                showSlider={false}
                adjustmentButtons={[]}
            />
        </div>
        <p class="value-display">Current percentage: {percentage}%</p>
    </div>
</div>

<style>
    .demo-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 2em;
    }

    h2 {
        color: var(--nc-tx-1);
        margin-bottom: 1.5em;
        border-bottom: 2px solid var(--nc-bg-3);
        padding-bottom: 0.5em;
    }

    .example-section {
        margin-bottom: 3em;
        padding: 1.5em;
        background-color: var(--nc-bg-1);
        border: 1px solid var(--nc-bg-3);
        border-radius: 8px;
    }

    .example-section h3 {
        margin-top: 0;
        color: var(--nc-ac-1);
    }

    .example-section p {
        color: var(--nc-tx-2);
        margin-bottom: 1em;
    }

    .picker-wrapper {
        background-color: var(--nc-bg-2);
        padding: 1.5em;
        border-radius: 8px;
        margin-bottom: 1em;
    }

    .value-display {
        font-weight: bold;
        color: var(--nc-tx-1);
        text-align: center;
        padding: 0.5em;
        background-color: var(--nc-bg-2);
        border-radius: 4px;
    }

    @media (max-width: 768px) {
        .demo-container {
            padding: 1em;
        }

        .example-section {
            padding: 1em;
        }

        .picker-wrapper {
            padding: 1em;
        }
    }
</style>
