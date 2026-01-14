<script lang="ts">
    import type { ModalProps } from 'svelte-modals';

    const { isOpen, close }: ModalProps<undefined> = $props();
</script>

{#if isOpen}
    <div role="dialog" class="modal">
        <div class="contents">
            <h4 class="title-bar">
                Metronome
                <button onclick={close}>Close</button>
            </h4>

            <div>
                This is a simple metronome:
                <ul>
                    <li>
                        Use the play/pause button or the space bar to start and stop the metronome
                    </li>
                    <li>You can change the tempo by:</li>
                    <ul>
                        <li>Entering a number directly in the input</li>
                        <li>Using the -5, -1, +1 and +5 buttons</li>
                        <li>
                            Taping a tempo on the tap button. When taping the tempo each tap counts
                            for a subdivision if subdivisions are enabled. Stop taping for approx. 3
                            seconds to restart the tap counter.
                        </li>
                    </ul>
                    <li>
                        The "Beats in bar" setting change the number of beats counted by the
                        metronome. The first beat is accented with a higher frequency tone.
                    </li>
                    <li>
                        The "Subdivisions in beat" setting allow to change how the beats are
                        divided. The subdivisions after the first one are played with a lower
                        frequency tone.
                    </li>
                    <li>
                        The visualization at the bottom follow the beats and their subdivisions.
                    </li>
                </ul>
            </div>

            <br />
            <h5>Bugs</h5>
            <ul>
                <li>
                    While it goes against my opinion on what the web should look like, this page
                    works better with Chrome-based browsers.
                </li>
                <li>
                    For some reason the display of the tempo settings is broken on Firefox, the
                    input doesn't resize properly.
                </li>
                <li>The sound doesn't work on Safari on iOS (and maybe on MacOS too).</li>
            </ul>
        </div>
    </div>
{/if}

<style>
    .modal {
        position: fixed;
        top: 0;
        bottom: 0;
        right: 0;
        left: 0;
        margin: 3em;
        z-index: 9999;

        /* allow click-through to backdrop */
        pointer-events: none;
    }

    .contents {
        min-width: 240px;
        border-radius: 26px;
        padding: 16px;
        background: var(--nc-bg-1);
        pointer-events: auto;

        max-height: 90%;
        overflow: auto;
    }

    .title-bar {
        margin-bottom: 1em;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }
</style>
