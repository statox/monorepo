<script lang="ts">
    /* This is a simple circular progress indicator meant to be used next to
     * some text. The size of the component is customized with the font-size
     * of its parent.
     *
     * TODO: Allow customizing the colors and maybe the direction of the
     * progress (filling the circle vs. emptying the circle is a matter
     * of using circumference * (1 - progress) or circumference * progress
     * in offset
     *
     * Usage in parent:
     *   in script:
     *   progress = $state(0);
     *   setInterval(() => progress = (progress + 0.1) % 1, 500);
     *
     *   in markup:
     *   <ProgressIndicatorCircular {progress} />
     */
    interface Props {
        progress: number; // progress value [0-1]
        displayValue?: boolean; // Display the progress as a number
    }
    let { progress, displayValue }: Props = $props();

    const boundedProgress = $derived(Math.max(0, Math.min(progress, 1)));

    const angle = $derived((1 - boundedProgress) * 360);

    const cx = 60;
    const cy = 60;
    const r = 50;

    let largeArc;
    let theta;

    let x;
    let y;

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
</script>

<svg viewBox="0 0 120 120" style="width: 1em; height: 1em; vertical-align: middle;">
    <circle {cx} {cy} {r} fill="black" />
    {#if progress === 0}
        <circle {cx} {cy} {r} fill="#eee" />
    {:else}
        <path d={path} fill="#eee" />
    {/if}
</svg>

{#if displayValue}
    {progress.toFixed(2)}
{/if}
