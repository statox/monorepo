<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { DurationPicker } from '$lib/components/DurationPicker';
    import { toast } from '$lib/components/Toast';
    import { user } from '$lib/auth/service';
    import { uploadToClipboard } from '$lib/Clipboard/api';

    const dispatch = createEventDispatcher();

    let name: string;
    let content: string;
    let fileInput: HTMLInputElement;
    let files: FileList | null;
    let isPublic = false;
    let ttlSeconds: number;

    const upload = async () => {
        if (!name.length) {
            // TODO handle this error in the UI
            console.error('name should be defined');
            return;
        }
        if (!content.length) {
            // TODO handle this error in the UI
            console.error('content should be defined');
            return;
        }

        if (ttlSeconds < 0) {
            // TODO handle this error in the UI
            console.error('TTL should be positive');
            return;
        }

        let file: File | undefined;
        if (files && files.length) {
            file = files[0] || undefined;
        }

        try {
            await uploadToClipboard({ name, content, ttlSeconds, isPublic, file });
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
            <label for="content">Content</label>
            <input type="textarea" bind:value={content} />
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

    <div class="visibility-section">
        <p class="visibility-section-item">
            <label for="ttlSeconds">TTL</label>
            <DurationPicker
                bind:valueInSeconds={ttlSeconds}
                allowedUnits={['minutes', 'hours', 'days', 'months', 'years']}
                defaultDuration={{value: 1, unit: 'days'}}
            />
        </p>


        <p class="visibility-section-item">
            <label for="isPublic">Access</label>
            <button
                class="visibility-status"
                class:visibility-public={isPublic}
                on:click={() => (isPublic = !isPublic)}
            >
                {#if isPublic}
                    Public
                    <i class="fas fa-lock-open"></i>
                {:else}
                    Private
                    <i class="fas fa-lock"></i>
                {/if}
            </button>
        </p>
    </div>

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
    .visibility-section {
        display: flex;
        flex-wrap: wrap;
    }
    .visibility-status {
        background-color: #07a761;
    }
    .visibility-public {
        background-color: #ff8f00;
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
        .visibility-section-item {
            flex: 1 0 100%;
        }
    }
    @media screen and (min-width: 750px) {
        .meta-section-item {
            flex: 1 0 50%; /* This will make the items take up 50% of the container's width, effectively creating two columns */
        }
        .meta-section-item > input {
            width: 100%;
        }
        .visibility-section-item {
            flex: 1 0 50%; /* This will make the items take up 50% of the container's width, effectively creating two columns */
        }
    }
</style>
