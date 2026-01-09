<script lang="ts">
    interface Props {
        size: number;
        unit: string;
        durationSeconds: number;
    }

    let { size = 50, unit = 'px', durationSeconds = 1 }: Props = $props();
    const duration = $derived(`${durationSeconds}s`);
</script>

<div id="loading" style="--size: {size}{unit};  --duration: {duration}"></div>

<style>
    #loading {
        display: inline-block;
        width: var(--size);
        height: var(--size);
        border: 5px solid color-mix(in srgb, var(--nc-ac-1) 50%, transparent 50%);
        border-radius: 50%;
        border-top-color: var(--nc-ac-1);
        animation: spin var(--duration) ease-in-out infinite;
        -webkit-animation: spin var(--duration) ease-in-out infinite;
    }

    @keyframes spin {
        to {
            -webkit-transform: rotate(360deg);
        }
    }
    @-webkit-keyframes spin {
        to {
            -webkit-transform: rotate(360deg);
        }
    }
</style>
