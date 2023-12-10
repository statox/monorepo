<script lang="ts">
    import Beats from './Beats.svelte';
    import TempoList from './TempoList.svelte';

    let taps: number[] = [];

    const keptDuration = 1000 * 15;
    let taped = false;
    let bpm = 0;

    const reset = () => {
        taps = [];
        bpm = 0;
        lastTap = 0;
    };

    const addBeat = () => {
        const now = Date.now();
        taps.push(Date.now());
        while (taps.length && taps[0] < now - keptDuration) {
            taps.shift();
        }
        taps = taps;

        taped = true;
        setTimeout(() => (taped = false), 100);
        computeBPM();
    };

    let lastTap = 0;
    let previousTap = 0;
    let groundZero = 0;
    let counter = 0;
    const computeBPM = () => {
        if (pause) {
            return;
        }
        const now = Date.now();

        if (lastTap === 0) {
            groundZero = now;
            counter = 0;
        }

        lastTap = now;
        const elapsed = now - previousTap;

        previousTap = lastTap;
        const tapDiff = lastTap - groundZero;
        if (tapDiff !== 0) {
            bpm = Math.round((60000 * counter) / tapDiff);
        }
        counter++;

        if (elapsed > 3000) {
            lastTap = 0;
        }
    };
    let pause = false;

    let keyReleased = true;
    const onKeyDown = (e: KeyboardEvent) => {
        const SPACE = ' ';
        const ENTER = 'Enter';
        const C = 'c';
        const allowedKeys = [SPACE, ENTER, C];
        if (!allowedKeys.includes(e.key)) {
            return;
        }
        e.preventDefault();
        if (!keyReleased) {
            return;
        }
        keyReleased = false;
        if (e.key === SPACE) {
            pause = false;
            addBeat();
            return;
        }
        if (e.key === ENTER) {
            pause = !pause;
            return;
        }
        if (e.key === C) {
            reset();
        }
    };

    const onKeyUp = (e: KeyboardEvent) => {
        const SPACE = ' ';
        if (!keyReleased && e.key === SPACE) {
            keyReleased = true;
            e.preventDefault();
        }
    };
</script>

<h3>Tap Tempo</h3>

<div class="container">
    <div>Press the space bar or click/tap anywhere on the page to get a bpm.</div>

    <div class="bpm" class:tapped={taped}>{bpm}<br />BPM</div>

    <div class="controls">
        <button class="control-button" on:click={reset}>Reset (c)</button>
        <button class="control-button" on:click={() => (pause = !pause)}
            >{pause ? 'Play' : 'Pause'} (Enter)</button
        >
    </div>

    <Beats {taps} {keptDuration} {pause} />

    <TempoList currentBpm={bpm} />
</div>

<svelte:window on:keydown={onKeyDown} on:keyup={onKeyUp} on:pointerdown={addBeat} />

<style>
    .container {
        /* Prevent selection to avoid highlighting content when using the mouse to tap the tempo */
        -webkit-user-select: none; /* Safari */
        -ms-user-select: none; /* IE 10 and IE 11 */
        user-select: none; /* Standard syntax */
    }
    .controls {
        display: flex;
        flex-wrap: wrap;
    }
    .control-button {
        flex: 1 0 40%;
        list-style-type: none;
        margin: 0.1em;
    }
    @media screen and (max-width: 400px) {
        .bpm {
            font-size: 6em;
        }
    }
    @media screen and (min-width: 400px) and (max-width: 600px) {
        .bpm {
            font-size: 9em;
        }
    }
    @media screen and (min-width: 600px) {
        .bpm {
            font-size: 12em;
        }
    }
    .bpm {
        text-align: center;
        font-weight: 500;
    }
    .tapped {
        background-color: var(--nc-bg-2);
    }
</style>
