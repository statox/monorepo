<script lang="ts">
    import { Metronome } from './Metronome';
    let metronome = new Metronome();

    const onKeyDown = (e: KeyboardEvent) => {
        const SPACE = ' ';
        const allowedKeys = [SPACE];
        if (!allowedKeys.includes(e.key)) {
            return;
        }
        e.preventDefault();
        if (e.key === SPACE) {
            metronome.startStop();
            return;
        }
    };
</script>

<h3>Metronome</h3>

<div>
    <button on:click={() => metronome.startStop() }>Play / Pause</button>
</div>

<div>
    <button on:click={() => metronome.tempo -= 5}>-5</button>
    <button on:click={() => metronome.tempo -= 1}>-1</button>
    <label for="tempo">Tempo:</label> <input bind:value={metronome.tempo} />
    <button on:click={() => metronome.tempo += 1}>+1</button>
    <button on:click={() => metronome.tempo += 5}>+5</button>
</div>

<div>
    <select bind:value={metronome.beatsPerBar} on:change={() => console.log(metronome.beatsPerBar)}>
        {#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as beatsPerBar}
            <option value={beatsPerBar}>
                {beatsPerBar}
            </option>
        {/each}
    </select>
</div>

<svelte:window on:keydown={onKeyDown} />
