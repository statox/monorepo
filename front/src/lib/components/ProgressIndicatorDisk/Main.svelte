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
     *   <ProgressIndicatorDisk {progress} />
     */

    interface Props {
        progress: number; // progress value [0-1]
        backgroundColor?: string;
        progressColor?: string;
        displayValue?: boolean; // Display the progress as a number
    }
    let { progress, backgroundColor, displayValue, progressColor }: Props = $props();

    const boundedProgress = $derived(Math.max(0, Math.min(progress, 1)));

    const angle = $derived((1 - boundedProgress) * 360);

    const cx = 60;
    const cy = 60;
    const r = 50;

    let largeArc: number;
    let theta: number;

    let x: number;
    let y: number;

    let path = $state('');
    $effect(() => {
        largeArc = angle > 180 ? 1 : 0;
        theta = (angle - 90) * (Math.PI / 180); // rotate so 0 starts at top

        x = cx + r * Math.cos(theta);
        y = cy + r * Math.sin(theta);

        path =
            progress === 0
                ? ''
                : `M${cx},${cy} L${cx},${cy - r} A${r},${r} 0 ${largeArc},1 ${x},${y} Z`;
    });

    let defaultBackgroundColor = $state('black');
    let defaultProgressColor = $state('white');
    onMount(() => {
        const bodyStyle = getComputedStyle(document.body);
        defaultBackgroundColor = bodyStyle.getPropertyValue('--nc-bg-1');
        defaultProgressColor = bodyStyle.getPropertyValue('--nc-tx-1');
    });
</script>

<svg viewBox="0 0 120 120" style="width: 1em; height: 1em; vertical-align: middle;">
    <circle {cx} {cy} {r} fill={progressColor || defaultProgressColor} />
    {#if progress === 0}
        <circle {cx} {cy} {r} fill={backgroundColor || defaultBackgroundColor} />
    {:else}
        <path d={path} fill={backgroundColor || defaultBackgroundColor} />
    {/if}
</svg>

{#if displayValue}
    {progress.toFixed(2)}
{/if}
