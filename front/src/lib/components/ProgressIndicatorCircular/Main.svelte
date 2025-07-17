<script>
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
    let { progress } = $props(); // progress value [0-1]

    const radius = 14;
    const circumference = 2 * Math.PI * radius;

    let offset = $derived(circumference * progress);
</script>

<svg
    viewBox="0 0 32 32"
    style="width:1em; height:1em; vertical-align:middle; transform: rotate(-90deg);"
>
    <!-- Background track circle (light gray) -->
    <circle cx="16" cy="16" r={radius} fill="none" stroke="#ddd" stroke-width="4" />

    <!-- Foreground progress circle (black) -->
    <circle
        cx="16"
        cy="16"
        r={radius}
        fill="none"
        stroke="black"
        stroke-width="4"
        stroke-dasharray={circumference}
        stroke-dashoffset={offset}
    />
</svg>
