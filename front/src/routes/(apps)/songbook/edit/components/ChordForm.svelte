<script lang="ts">
    import type { ModalProps } from 'svelte-modals';
    import { AuthGuard } from '$lib/components/AuthGuard';

    interface Props extends ModalProps {
        onNewSongSubmit: (params: {
            title: string;
            artist: string;
            url: string;
            tags: string[];
        }) => Promise<void>;
    }

    let { isOpen, close, onNewSongSubmit }: Props = $props();

    let title: string = $state('');
    let artist: string = $state('');
    let url: string = $state('');
    let tagsStr: string = $state('');

    const submit = () => {
        const tags = [];
        if (tagsStr) {
            tags.push(...tagsStr.replaceAll(' ', '').split(','));
        }
        onNewSongSubmit({ title, artist, url, tags });
    };
</script>

{#if isOpen}
    <div role="dialog" class="modal">
        <div class="contents">
            <h4 class="title-bar">
                Add a new song
                <button onclick={close}>Close</button>
            </h4>

            <AuthGuard message="Login to add a new song" requiredScope="admin">
                <form class="form-content">
                    <label for="artist">Artist</label>
                    <input type="text" bind:value={artist} />

                    <label for="title">Title</label>
                    <input type="text" bind:value={title} />

                    <label for="url">Url</label>
                    <input type="text" bind:value={url} />

                    <label for="tags">Tags</label>
                    <input type="text" bind:value={tagsStr} />

                    <button class="form-action" onclick={submit}>Submit</button>
                </form>
            </AuthGuard>
        </div>
    </div>
{/if}

<style>
    .form-action {
        grid-column: span 2;
    }

    .form-content {
        display: grid;
        grid-template-columns: auto auto;
    }

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
