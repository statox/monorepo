<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { user } from '$lib/auth/service';
    import { uploadToClipboard } from '$lib/Clipboard/api';

    const dispatch = createEventDispatcher();

    let name: string;
    let content: string;
    let ttlSeconds = 3600;
    let isPublic = false;

    let error: string;
    const upload = () => {
        if (!name.length) {
            error = 'name should be defined';
            return;
        }
        if (!content.length) {
            error = 'content should be defined';
            return;
        }
        if (ttlSeconds < 0) {
            error = 'TTL should be positive';
            return;
        }

        uploadToClipboard({ name, content, ttlSeconds, isPublic })
            .then((_response) => dispatch('upload'))
            .catch((apiError) => {
                error = apiError.message;
            });
    };
</script>

{#if $user}
    <p>
        <label for="name">Name</label>
        <input type="text" bind:value={name} />
    </p>

    <p>
        <label for="content">Content</label>
        <input type="text" bind:value={content} />
    </p>

    <p>
        <label for="ttlSeconds">TTL (seconds)</label>
        <input type="number" min="0" bind:value={ttlSeconds} />
    </p>

    <p>
        <label for="isPublic">Public</label>
        <input type="checkbox" bind:checked={isPublic} />
    </p>

    <p>
        <button on:click={upload}>Upload</button>
    </p>
{:else}
    <p>Login to upload content</p>
{/if}
