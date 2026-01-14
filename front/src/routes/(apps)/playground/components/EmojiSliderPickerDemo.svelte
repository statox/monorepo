<script lang="ts">
    import { EmojiSliderPicker, type EmojiSliderOption } from '$lib/components/EmojiSliderPicker';

    // Mood example - default color palette
    let moodValue = $state(5);
    const moodOptions: EmojiSliderOption[] = [
        { value: 1, emoji: '😢', label: 'Terrible' },
        { value: 2, emoji: '😟', label: 'Very Bad' },
        { value: 3, emoji: '😕', label: 'Bad' },
        { value: 4, emoji: '😐', label: 'Poor' },
        { value: 5, emoji: '🙂', label: 'Okay' },
        { value: 6, emoji: '😊', label: 'Good' },
        { value: 7, emoji: '😄', label: 'Great' },
        { value: 8, emoji: '😁', label: 'Very Good' },
        { value: 9, emoji: '🤩', label: 'Excellent' },
        { value: 10, emoji: '😍', label: 'Amazing' }
    ];

    // Pain scale - 5 levels with custom colors
    let painValue = $state(1);
    const painOptions: EmojiSliderOption[] = [
        { value: 1, emoji: '😊', label: 'No Pain' },
        { value: 2, emoji: '😐', label: 'Mild' },
        { value: 3, emoji: '😟', label: 'Moderate' },
        { value: 4, emoji: '😣', label: 'Severe' },
        { value: 5, emoji: '😭', label: 'Extreme' }
    ];

    const painColors = ['#504746', '#B89685', '#BFADA3', '#FBB7C0', '#B6244F'];
</script>

<div class="demo-container">
    <h2>EmojiSliderPicker Examples</h2>

    <div class="example-section">
        <h3>1. Mood Tracker (Default Colors)</h3>
        <p>10-level scale with auto-generated red-to-green gradient</p>
        <div class="picker-wrapper">
            <EmojiSliderPicker bind:value={moodValue} options={moodOptions} />
        </div>
        <p class="value-display">Current value: {moodValue} - {moodOptions[moodValue - 1].label}</p>
    </div>

    <div class="example-section">
        <h3>2. Pain Scale (5 Levels)</h3>
        <p>5-level scale with inverted custom colors (green = good, red = bad)</p>
        <div class="picker-wrapper">
            <EmojiSliderPicker
                bind:value={painValue}
                options={painOptions}
                colorPalette={painColors}
            />
        </div>
        <p class="value-display">Current value: {painValue} - {painOptions[painValue - 1].label}</p>
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
