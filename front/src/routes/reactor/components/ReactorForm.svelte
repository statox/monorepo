<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { toast } from '$lib/components/Toast';
    import { user } from '$lib/auth/service';
    import { uploadToReactor } from '$lib/Reactor/api';

    const dispatch = createEventDispatcher();

    let name: string;
    let commaSeparatedTags = '';
    let fileInput: HTMLInputElement;
    let files: FileList | null;

    const upload = async () => {
        try {
            if (!name?.length) {
                throw new Error('A name is required for upload');
            }
            let file: File | undefined;
            if (files && files.length) {
                file = files[0];
            }
            if (!file) {
                throw new Error('A file is required for upload');
            }
            await uploadToReactor({ name, commaSeparatedTags, file });
            dispatch('upload');
        } catch (error: unknown) {
            const message = `<strong>Entry not created</strong><br/> ${(error as Error).message}`;
            toast.push(message, {
                theme: {
                    '--toastBarBackground': '#FF0000'
                }
            });
        }
    };
</script>

{#if $user}
    <div class="meta-section">
        <p class="meta-section-item">
            <label for="name">Name</label>
            <input type="text" bind:value={name} />
        </p>
        <p class="meta-section-item">
            <label for="content">Tags</label>
            <input type="textarea" bind:value={commaSeparatedTags} />
        </p>
    </div>

    <p class="file-section">
        <label for="file">File</label>
        <input class="file-input" type="file" bind:files bind:this={fileInput} />
        <button
            on:click={() => {
                fileInput.value = '';
            }}
        >
            <i class="fas fa-times-circle"></i>
        </button>
    </p>

    <p>
        <button on:click={upload}>Upload</button>
    </p>
{:else}
    <p>Login to upload content</p>
{/if}

<style>
    .meta-section {
        display: flex;
        flex-wrap: wrap;
    }
    .file-section {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
    }
    .file-input {
        flex-grow: 2;
    }

    @media screen and (max-width: 750px) {
        .meta-section-item {
            flex: 1 0 100%;
        }
        .meta-section-item > input {
            width: 100%;
        }
    }
    @media screen and (min-width: 750px) {
        .meta-section-item {
            flex: 1 0 50%; /* This will make the items take up 50% of the container's width, effectively creating two columns */
        }
        .meta-section-item > input {
            width: 100%;
        }
    }
</style>
