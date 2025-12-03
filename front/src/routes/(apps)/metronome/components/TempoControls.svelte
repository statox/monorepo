<script lang="ts">
    interface Props {
        tempo: number;
        onTempoUpdate: (tempo: number) => void;
    }

    let { tempo = $bindable(), onTempoUpdate }: Props = $props();

    const updateTempo = (event: Event) => {
        if (!event || !event.target) {
            return;
        }
        const target = event.target as HTMLInputElement;
        const value = Number(target.value);
        if (!value || value < 1) {
            return;
        }
        onTempoUpdate(value);
    };
</script>

<div class="tempo-container">
    <div class="tempo-less">
        <button onclick={() => onTempoUpdate(tempo - 5)}>-5</button>
        <button onclick={() => onTempoUpdate(tempo - 1)}>-1</button>
    </div>
    <div class="tempo-value" style="font-size: x-large">
        <input
            style="font-size: x-large; margin-right: 0.1em;"
            type="number"
            min="1"
            max="400"
            bind:value={tempo}
            onchange={updateTempo}
        /> BPM
    </div>
    <div class="tempo-more">
        <button onclick={() => onTempoUpdate(tempo + 1)}>+1</button>
        <button onclick={() => onTempoUpdate(tempo + 5)}>+5</button>
    </div>
</div>

<style>
    .tempo-container {
        display: flex;
        justify-content: space-evenly;
        flex-direction: row;
        margin: 1em;
    }
    .tempo-less {
        order: 1;
    }
    .tempo-value {
        order: 2;
    }
    .tempo-more {
        order: 3;
    }
    @media screen and (max-width: 500px) {
        .tempo-container {
            display: flex;
            justify-content: center;
            flex-direction: column;
            margin: 1em;
            gap: 1em;
        }
        .tempo-less {
            order: 2;
            display: flex;
            justify-content: space-evenly;
        }
        .tempo-value {
            order: 1;
            display: flex;
            justify-content: center;
        }
        .tempo-more {
            order: 3;
            display: flex;
            justify-content: space-evenly;
        }
    }
</style>
