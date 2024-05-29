<script lang="ts">
    // import { createEventDispatcher } from 'svelte';
    import { toast } from '$lib/components/Toast';
    import { user } from '$lib/auth/service';
    import type { WatchedContent } from '$lib/WebWatcher/types';

    // const dispatch = createEventDispatcher();

    export let watcher: WatchedContent;

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const lastCheckDisplay =
        watcher.lastCheckDateUnix === 0
            ? 'Never checked before'
            : formatTimestamp(watcher.lastCheckDateUnix);
    const lastContentChangeDisplay =
        watcher.lastUpdateDateUnix === 0
            ? 'Never changed'
            : formatTimestamp(watcher.lastUpdateDateUnix);

    const deleteWatcher = async () => {
        if (!watcher.id) {
            // TODO handle this error in the UI
            console.error('id must be defined');
            return;
        }

        toast.push('TODO implement deletion', {
            theme: {
                '--toastBarBackground': '#FF0000'
            }
        });
        // try {
        //     await createWatcher({
        //         name,
        //         notificationMessage,
        //         url,
        //         cssSelector,
        //         checkIntervalSeconds
        //     });
        //     dispatch('upload');
        // } catch (error: unknown) {
        //     const message = `<strong>Entry not created</strong><br/> ${(error as Error).message}`;
        //     toast.push(message, {
        //         theme: {
        //             '--toastBarBackground': '#FF0000'
        //         }
        //     });
        // }
    };
</script>

{#if $user}
    <div class="item">
        <h4 class="item-title">
            {watcher.name}
            <button class="delete-button" on:click={deleteWatcher}>
                <i class="fas fa-trash-alt"></i>
            </button>
        </h4>
        <div class="section">
            <p class="section-1-item">
                <label for="check-interval">Check interval (seconds)</label>
                <input disabled type="number" bind:value={watcher.checkIntervalSeconds} />
            </p>
        </div>

        <div class="section">
            <p class="section-2-item">
                <label for="notification-message">Notification message</label>
                <input disabled type="textarea" bind:value={watcher.notificationMessage} />
            </p>
        </div>

        <div class="section">
            <p class="section-3-item">
                <label for="content">URL</label>
                <a target="_blank" rel="noopener noreferrer" href="{watcher.url}">{watcher.url}</a>
            </p>
            <p class="section-3-item">
                <label for="css-selector">CSS selector</label>
                <input disabled type="textarea" bind:value={watcher.cssSelector} />
            </p>
        </div>

        <div class="section">
            <p class="section-4-item">
                <label for="last-check">Last check</label>
                <input disabled type="textarea" value={lastCheckDisplay} />
            </p>
            <p class="section-4-item">
                <label for="last-update">Last content change</label>
                <input disabled type="textarea" value={lastContentChangeDisplay} />
            </p>
        </div>

        <div class="section">
            <p class="section-3-item">
                <label for="last-update">Last content</label>
                <input disabled type="textarea" value={watcher.lastContent} />
            </p>
        </div>
    </div>
{/if}

<style>
    .item {
        padding: 1em;
        border-radius: 5px;
        background: var(--nc-bg-2);
        border: 1px solid var(--nc-bg-3);
    }

    .item-title {
        display: flex;
        justify-content: space-between;
    }

    .delete-button {
        height: 33px;
        background: red;
        color: white;
        width: 40px;
    }

    .section {
        display: flex;
        flex-wrap: wrap;
    }

    .section-2-item {
        flex: 1 0 100%;
    }
    .section-2-item > input {
        width: 100%;
    }

    .section-3-item {
        flex: 1 0 100%;
    }
    .section-3-item > input {
        width: 100%;
    }

    @media screen and (max-width: 750px) {
        .section-1-item {
            flex: 1 0 100%;
        }
        .section-1-item > input {
            width: 100%;
        }

        .section-4-item {
            flex: 1 0 100%;
        }
        .section-4-item > input {
            width: 100%;
        }
    }
    @media screen and (min-width: 750px) {
        .section-1-item {
            flex: 1 0 50%; /* This will make the items take up 50% of the container's width, effectively creating two columns */
        }
        .section-4-item {
            flex: 1 0 50%;
        }
    }
</style>
