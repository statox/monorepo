<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { toast } from '$lib/components/Toast';
    import { user } from '$lib/auth/service';
    import { createWatcher } from '$lib/WebWatcher/api';

    const dispatch = createEventDispatcher();

    let name: string;
    let notificationMessage: string;
    let url: string;
    let cssSelector: string;
    let checkIntervalSeconds: number = 15 * 60;

    const upload = async () => {
        if (!name.length || !url || !notificationMessage || !cssSelector) {
            // TODO handle this error in the UI
            console.error('name should be defined');
            return;
        }

        try {
            await createWatcher({
                name,
                notificationMessage,
                url,
                cssSelector,
                checkIntervalSeconds
            });
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
            <label for="content">URL</label>
            <input type="textarea" bind:value={url} />
        </p>
    </div>

    <p>
        <label for="notification-message">Notification message</label>
        <input type="textarea" bind:value={notificationMessage} />
    </p>

    <p>
        <label for="css-selector">CSS selector</label>
        <input type="textarea" bind:value={cssSelector} />
    </p>

    <p>
        <label for="check-interval">Check interval (seconds)</label>
        <input type="textarea" bind:value={checkIntervalSeconds} />
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
</style>
