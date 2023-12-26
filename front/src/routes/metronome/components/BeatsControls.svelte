<script lang="ts">
    import type { Metronome } from '$lib/Metronome';

    export let metronome: Metronome;
</script>

<div class="controls-container">
    <div class="controls-sub-container">
        <label for="beatsInBar"><h4>Beats in bar</h4></label>
        <div class="subdivisions-container">
            <button
                on:click={() => (metronome.beatsPerBar = Math.max(metronome.beatsPerBar - 1, 1))}
            >
                -1
            </button>
            <span style="font-size: large; margin-left: 1em; margin-right: 1em">
                {metronome.beatsPerBar}
            </span>
            <button
                on:click={() => (metronome.beatsPerBar = Math.min(metronome.beatsPerBar + 1, 10))}
            >
                +1
            </button>
        </div>
    </div>
    <br />

    <div class="controls-sub-container">
        <label for="subdivisionsInBeat"><h4>Subdivisions in beat</h4></label>

        <div class="subdivisions-container">
            <button
                class:selected={metronome.subdivisionsInBeat === 1}
                on:click={() => (metronome.subdivisionsInBeat = 1)}
            >
                <svg
                    width="15"
                    height="15"
                    fill="blue"
                    xmlns="http://www.w3.org/2000/svg"
                    style="width: 15px; height: auto;"
                    ><path
                        d="M 4.3 0 v 9.6 A 2.9 2.9 0 0 0 0 12.1 A 3 3 0 0 0 3 15 c 1.5 0 2.8 -1.3 2.8 -2.9 V 3 V 0 H 4.3 Z"
                    ></path></svg
                >
            </button>
            <button
                class:selected={metronome.subdivisionsInBeat === 2}
                on:click={() => (metronome.subdivisionsInBeat = 2)}
            >
                <svg
                    width="15"
                    height="15"
                    fill="blue"
                    xmlns="http://www.w3.org/2000/svg"
                    style="width: 15px; height: auto;"
                    ><path
                        d="M4.3 0v9.6A2.9 2.9 0 0 0 0 12.1 3 3 0 0 0 3 15c1.5 0 2.8-1.3 2.8-2.9V3h7.7v6.6a2.9 2.9 0 0 0-4.3 2.5 2.9 2.9 0 0 0 5.8 0V0H4.3Z"
                    ></path></svg
                >
            </button>
            <button
                class:selected={metronome.subdivisionsInBeat === 3}
                on:click={() => (metronome.subdivisionsInBeat = 3)}
            >
                <svg
                    width="24"
                    height="21"
                    fill="blue"
                    xmlns="http://www.w3.org/2000/svg"
                    style="width: 24px; height: auto; top: -3px;"
                    ><path
                        clip-rule="evenodd"
                        d="M4.3 15.6V6H24v12.1a3 3 0 0 1-3 2.9 2.9 2.9 0 0 1-2.8-2.9 2.9 2.9 0 0 1 4.3-2.5V9H15v9.1a2.9 2.9 0 0 1-3 2.9 3 3 0 0 1-3-2.9 2.9 2.9 0 0 1 3-2.8c.5 0 1 0 1.3.3V9H5.8v9.1C5.8 19.7 4.5 21 3 21a3 3 0 0 1-3-2.9 2.9 2.9 0 0 1 4.3-2.5Z"
                    ></path><path
                        d="M12.6 2.2 13.9.5V0h-3.1v.4h2.5l-1.4 1.7v.4h.4c.9 0 1.3.4 1.3 1s-.4 1-1.2 1c-.7 0-1.3-.3-1.6-.6l-.2.4c.4.4 1 .6 1.8.6 1.1 0 1.7-.6 1.7-1.4 0-.8-.5-1.3-1.5-1.4Z"
                    ></path></svg
                >
            </button>
            <button
                class:selected={metronome.subdivisionsInBeat === 4}
                on:click={() => (metronome.subdivisionsInBeat = 4)}
            >
                <svg
                    width="27"
                    height="13"
                    fill="blue"
                    xmlns="http://www.w3.org/2000/svg"
                    style="width: 27px; height: auto;"
                    ><path
                        clip-rule="evenodd"
                        d="M3.5 0v7.9a2 2 0 0 0-1.1-.3C1 7.6 0 8.6 0 9.9c0 1.3 1 2.4 2.4 2.4 1.3 0 2.3-1 2.3-2.4V3.4H11V8a2 2 0 0 0-1.1-.3 2.3 2.3 0 1 0 0 4.7c1.3 0 2.4-1 2.4-2.4V3.4h6.1V8a2.4 2.4 0 0 0-1-.3c-1.4 0-2.5 1-2.5 2.3 0 1.3 1.1 2.4 2.4 2.4 1.3 0 2.4-1 2.4-2.4V3.4h6.2V8l-1.2-.3c-1.3 0-2.3 1-2.3 2.3a2.3 2.3 0 1 0 4.7 0V0H3.5Zm7.4 2.7H4.7V1.5H11v1.2Zm7.4 0h-6.1V1.5h6.1v1.2Zm1.3 0h6.2V1.5h-6.2v1.2Z"
                    ></path></svg
                >
            </button>
        </div>
    </div>
</div>

<style>
    button.selected {
        background: var(--nc-lk-2);
    }

    .subdivisions-container {
        display: flex;
        justify-content: space-evenly;
        gap: 0.1em;
        flex-wrap: wrap;
    }

    .controls-container {
        display: flex;
        margin: 1em;
    }
    .controls-sub-container {
        display: flex;
    }
    @media screen and (max-width: 500px) {
        .controls-container {
            flex-direction: column;
        }
        .controls-sub-container {
            flex-direction: column;
            justify-content: space-between;
        }
    }
    @media screen and (min-width: 500px) and (max-width: 700px) {
        .controls-container {
            flex-direction: column;
            justify-content: space-evenly;
        }
        .controls-sub-container {
            flex-direction: row;
            justify-content: space-between;
        }
    }
    @media screen and (min-width: 700px) {
        .controls-container {
            flex-direction: row;
            justify-content: space-around;
        }
        .controls-sub-container {
            flex-direction: column;
            justify-content: space-around;
        }
    }
</style>
