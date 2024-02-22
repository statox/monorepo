<script lang="ts">
    import { user } from '$lib/auth/service';
    import { toast } from '$lib/components/Toast';
    import NewChordModal from './components/NewChordModal.svelte';
    import type { RawChord } from '$lib/Songbook/types';
    import { uploadChords } from '$lib/Songbook/api';

    import { JSONEditor, Mode, createAjvValidator } from 'svelte-jsoneditor';
    import type { JSONContent } from 'svelte-jsoneditor';
    import { goto } from '$app/navigation';
    import { closeModal, openModal } from '$lib/components/Modal';

    // From +page.ts load() function
    export let data: { chords: RawChord[] };
    let { chords } = data;
    let content = {
        json: chords
    };

    const schema = {
        type: 'array',
        items: {
            type: 'object',
            required: ['artist', 'title', 'url', 'creationDate', 'tags'],
            additionalProperties: false,
            properties: {
                artist: {
                    type: 'string'
                },
                title: {
                    type: 'string'
                },
                url: {
                    type: 'string'
                },
                creationDate: {
                    type: 'number'
                },
                tags: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                }
            }
        }
    };

    const validator = createAjvValidator({ schema });
    let editor: JSONEditor;

    let isValid = true;
    const onJsonChange = () => {
        if (editor.validate()) {
            isValid = false;
            return;
        }
        isValid = true;
    };

    const upload = async () => {
        if (editor.validate()) {
            return;
        }

        try {
            const content = editor.get() as JSONContent;
            await uploadChords(content.json);
            toast.push('<i class="fas fa-check"></i> Uploaded');
        } catch (error) {
            const message = `<strong>Upload failed</strong><br/> ${(error as Error).message}`;
            toast.push(message, {
                theme: {
                    '--toastBarBackground': '#FF0000'
                }
            });
        }
    };

    const onNewSongSubmit = async (params: {
        title: string;
        artist: string;
        url: string;
        tags: string[];
    }) => {
        const now = Date.now();
        chords = [{ ...params, creationDate: now }, ...chords];

        try {
            await uploadChords(chords);
            closeModal();
            content = { json: chords };
            toast.push('<i class="fas fa-check"></i> Uploaded');
        } catch (error) {
            const message = `<strong>Entry not created</strong><br/> ${(error as Error).message}`;
            toast.push(message, {
                duration: 0,
                theme: {
                    '--toastBarBackground': '#FF0000'
                }
            });
        }
    };
</script>

<h2>
    Edit song book

    <span class="pull-right">
        <button style:position="relative" on:click={() => goto('/songbook')}>
            Back to songbook
        </button>
    </span>
</h2>

<button style:position="relative" on:click={() => openModal(NewChordModal, { onNewSongSubmit })}>
    Add a song
</button>

{#if chords?.length}
    {#if isValid}
        {#if $user}
            <button on:click={upload}>Upload</button>
        {:else}
            <span>Login to upload changes</span>
        {/if}
    {/if}
    <div class="json-editor jse-theme-dark" style="width: 100%">
        <JSONEditor
            bind:this={editor}
            bind:content
            mode={Mode.table}
            mainMenuBar={true}
            {validator}
            onChange={onJsonChange}
        />
    </div>
{/if}
