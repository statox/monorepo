<script lang="ts">
    import { onMount } from 'svelte';

    /* This is a simple circular progress indicator meant to be used next to
     * some text. The size of the component is customized with the font-size
     * of its parent.
     *
     * By default the colors of the css theme are used but it's possible to
     * change that by passing the props backgroundColor and progressColor
     *
     * The progressColor will progress counter clockwise as progress increase
     *
     * Usage in parent:
     *   in script:
     *   progress = $state(0);
     *   setInterval(() => progress = (progress + 0.1) % 1, 500);
     *
     *   in markup:
     *   <ProgressIndicatorCircle {progress} />
     */

    interface Props {
        progress: number; // progress value [0-1]
        backgroundColor?: string;
        progressColor?: string;
        displayValue?: boolean; // Display the progress as a number
    }
    let { progress, backgroundColor, displayValue, progressColor }: Props = $props();

    const boundedProgress = $derived(Math.max(0, Math.min(progress, 1)));

    const radius = 14;
    const circumference = 2 * Math.PI * radius;

    const offset = $derived(circumference * boundedProgress);

    let defaultBackgroundColor = $state('black');
    let defaultProgressColor = $state('white');
    onMount(() => {
        const bodyStyle = getComputedStyle(document.body);
        defaultBackgroundColor = bodyStyle.getPropertyValue('--nc-bg-1');
        defaultProgressColor = bodyStyle.getPropertyValue('--nc-tx-1');
    });
</script>

<svg
    viewBox="0 0 32 32"
    style="width:1em; height:1em; vertical-align:middle; transform: rotate(-90deg);"
>
    <!-- Background track circle -->
    <circle
        cx="16"
        cy="16"
        r={radius}
        fill="none"
        stroke={progressColor || defaultProgressColor}
        stroke-width="4"
    />

    <!-- Foreground progress circle (disappearing to show the background as progress increase) -->
    <circle
        cx="16"
        cy="16"
        r={radius}
        fill="none"
        stroke={backgroundColor || defaultBackgroundColor}
        stroke-width="4"
        stroke-dasharray={circumference}
        stroke-dashoffset={offset}
    />
</svg>

{#if displayValue}
    {progress.toFixed(2)}
{/if}
