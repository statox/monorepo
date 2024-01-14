<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { toast } from '$lib/components/Toast';
    import { user } from '$lib/auth/service';
    import { uploadToClipboard } from '$lib/Clipboard/api';
    import { Duration, type DurationLikeObject } from 'luxon';

    const dispatch = createEventDispatcher();

    let name: string;
    let content: string;
    let files: FileList;
    let isPublic = false;

    const ttlUnits = ['minutes', 'hours', 'days'];
    const ttlInput = {
        value: 10,
        unit: ttlUnits[0]
    };

    let error: string;
    const upload = async () => {
        if (!name.length) {
            error = 'name should be defined';
            return;
        }
        if (!content.length) {
            error = 'content should be defined';
            return;
        }

        const durationLikeObj: DurationLikeObject = {};
        durationLikeObj[ttlInput.unit as 'minutes' | 'hours' | 'days'] = ttlInput.value;
        const ttlDuration = Duration.fromObject(durationLikeObj);
        let ttlSeconds = ttlDuration.as('seconds');
        if (ttlSeconds < 0) {
            error = 'TTL should be positive';
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
        <input class="file-input" type="file" bind:files />
    </p>

    <div class="visibility-section">
        <p class="visibility-section-item">
            <label for="ttlSeconds">TTL</label>
            <input type="number" min="0" bind:value={ttlInput.value} />
            <select bind:value={ttlInput.unit}>
                {#each ttlUnits as unit}
                    <option value={unit}>{unit}</option>
                {/each}
            </select>
        </p>

        <p class="visibility-section-item">
            <label for="isPublic">Public</label>
            <input type="checkbox" bind:checked={isPublic} />
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
    .file-section {
        display: flex;
        flex-wrap: wrap;
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
