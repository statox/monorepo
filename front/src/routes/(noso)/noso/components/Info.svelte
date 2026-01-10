<script lang="ts">
    import type { ModalProps } from 'svelte-modals';

    let { isOpen, close }: ModalProps = $props();
</script>

{#if isOpen}
    <div role="dialog" class="modal">
        <div class="contents">
            <h3 class="title-bar">
                Add a new watcher
                <button onclick={close}>Close</button>
            </h3>
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
        max-width: 900px;

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
