<script lang="ts">
    import type { ModalProps } from 'svelte-modals';

    const { isOpen, close }: ModalProps<undefined> = $props();
</script>

{#if isOpen}
    <div role="dialog" class="modal">
        <div class="contents">
            <h4 class="title-bar">
                Chord Wheel
                <button onclick={close}>Close</button>
            </h4>

            <div>
                This page is an implementation of <a
                    href="https://chordwheel.com/"
                    target="_blank"
                    rel="noopener noreferrer">Jim Fleser's Chord Wheel</a
                >
                it is intended for my personal use. If you are using this implementation you should definitely
                <a
                    href="https://chordwheel.com/index.php?option=com_content&view=article&id=16&Itemid=4"
                    target="_blank"
                    rel="noopener noreferrer">buy his book</a
                >
                or
                <a
                    href="https://apps.apple.com/us/app/the-chord-wheel/id444931977"
                    target="_blank"
                    rel="noopener noreferrer">buy his app</a
                > (which is much more complete than this page).
            </div>

            <div>
                This tool only works for songs in major keys.
                <ul>
                    <li>
                        <a
                            href="https://chordwheel.com/index.php?option=com_content&view=article&id=5&Itemid=17"
                            target="_blank"
                            rel="noopener noreferrer">Analyzing songs and compositional styles</a
                        >
                    </li>
                    <li>
                        <a
                            href="https://chordwheel.com/index.php?option=com_content&view=article&id=8:soloing-and-improvisation&catid=8:using-the-chordwheel&Itemid=8"
                            target="_blank"
                            rel="noopener noreferrer">Soloing and improvisation</a
                        >
                    </li>
                    <li>
                        <a
                            href="https://chordwheel.com/index.php?option=com_content&view=article&id=9&Itemid=5"
                            target="_blank"
                            rel="noopener noreferrer">Transpositions</a
                        >
                    </li>
                </ul>
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
