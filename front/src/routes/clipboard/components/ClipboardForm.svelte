<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { user } from '$lib/auth/service';
    import { uploadToClipboard } from '$lib/Clipboard/api';
    import { Duration, type DurationLikeObject } from 'luxon';

    const dispatch = createEventDispatcher();

    let name: string;
    let content: string;
    let isPublic = false;

    const ttlUnits = ['minutes', 'hours', 'days'];
    const ttlInput = {
        value: 10,
        unit: ttlUnits[0]
    }

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

        const durationLikeObj: DurationLikeObject = {};
        durationLikeObj[ttlInput.unit as 'minutes'|'hours'|'days'] = ttlInput.value;
        const ttlDuration = Duration.fromObject(durationLikeObj);
        let ttlSeconds = ttlDuration.as('seconds');
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
        <label for="ttlSeconds">TTL</label>
        <input type="number" min="0" bind:value={ttlInput.value} />
        <select bind:value={ttlInput.unit}>
            {#each ttlUnits as unit}
                <option value={unit}>{unit}</option>
            {/each}
        </select>
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
