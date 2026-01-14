<script lang="ts">
    import { NumericSliderPicker } from '$lib/components/NumericSliderPicker';

    interface Props {
        tempo: number;
    }

    let { tempo = $bindable() }: Props = $props();
</script>

<NumericSliderPicker
    bind:value={tempo}
    min={1}
    max={400}
    step={1}
    unit="BPM"
    decimals={0}
    adjustmentButtons={[-5, -1, 1, 5]}
/>
