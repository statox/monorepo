<script lang="ts">
    import { uploadNewSong } from '$lib/Songbook/api';
    import { closeModal } from '$lib/components/Modal';
    export let isOpen: boolean;

    let title: string;
    let artist: string;
    let url: string;
    let tagsStr: string;

    const submit = () => {
        const tags = tagsStr.replaceAll(' ', '').split(',');
        console.log('submitting');
        console.log({title, artist, url, tags});
        uploadNewSong({title, artist, url, tags});
    }
</script>

{#if isOpen}
    <div role="dialog" class="modal">
        <div class="contents">
            <h4 class="title-bar">
                Add a new song
                <button on:click={closeModal}>Close</button>
            </h4>

            <form>
                <label for="artist">Artist</label>
                <input type="text" bind:value={artist} />

                <label for="title">Title</label>
                <input type="text" bind:value={title} />

                <label for="url">Url</label>
                <input type="text" bind:value={url} />

                <label for="tags">Tags</label>
                <input type="text" bind:value={tagsStr} />

                <button on:click={submit}>Submit</button>
            </form>
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
