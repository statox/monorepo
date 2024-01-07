<script lang="ts">
    import { closeModal } from '$lib/components/Modal';
    export let isOpen: boolean;
</script>

{#if isOpen}
    <div role="dialog" class="modal">
        <div class="contents">
            <h4 class="title-bar">
                Chord Progressions
                <button on:click={closeModal}>Close</button>
            </h4>

            <div>
                This is a list of chord progressions I took from David Benett's videos and elsewhere
                too

                <ul>
                    <li>
                        <a
                            href="https://www.youtube.com/watch?v=Vyc8lezaa9g"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            David Benett - 7 super common chord progressions and why they work
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://www.youtube.com/watch?v=v3YbEL-_eoI"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            David Benett - 6 more common chord progressions and why they work
                        </a>
                    </li>
                </ul>

                The user can change the tonic note in the "Scales" section and the progressions will
                change the actual chords to play.
            </div>
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
        background: white;
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
