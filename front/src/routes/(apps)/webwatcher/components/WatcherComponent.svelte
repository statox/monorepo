<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { ButtonCopy } from '$lib/components/ButtonCopy';
    import { ButtonDelete } from '$lib/components/ButtonDelete';
    import { ButtonSwitch } from '$lib/components/ButtonSwitch';
    import { toast } from '$lib/components/Toast';
    import { user } from '$lib/auth2';
    import type { WatchedContent } from '$lib/WebWatcher/types';
    import { Duration } from 'luxon';
    import { deleteWatcherAPI, toggleWatcherEnabledAPI } from '$lib/WebWatcher/api';

    const dispatch = createEventDispatcher();

    interface Props {
        watcher: WatchedContent;
    }

    let { watcher }: Props = $props();

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const lastCheckDisplay =
        watcher.lastCheckDateUnix === 0
            ? 'Never checked before'
            : formatTimestamp(watcher.lastCheckDateUnix || 0);
    const lastContentChangeDisplay =
        watcher.lastUpdateDateUnix === 0
            ? 'Never changed'
            : formatTimestamp(watcher.lastUpdateDateUnix || 0);
    const humanCheckInterval = Duration.fromMillis(watcher.checkIntervalSeconds * 1000)
        .rescale()
        .toHuman();

    const deleteWatcher = async () => {
        if (!watcher.id) {
            // TODO handle this error in the UI
            console.error('id must be defined');
            return;
        }

        try {
            await deleteWatcherAPI({ id: watcher.id });
            dispatch('delete');
        } catch (error: unknown) {
            const message = `<strong>Watcher not deleted</strong><br/> ${(error as Error).message}`;
            toast.push(message, {
                theme: {
                    '--toastBarBackground': '#FF0000'
                }
            });
        }
    };

    const updateWatcherEnabled = async (event: CustomEvent) => {
        await toggleWatcherEnabledAPI({
            watcherId: watcher.id,
            setToEnabled: event.detail === 'on'
        });
        dispatch('update');
    };

    let isEnabled = watcher.archivalDateUnix ? 'off' : 'on';
</script>

{#if $user}
    <div class="item">
        <h3 class="item-title">
            <div class="item-name">{watcher.name}</div>
            <div class="item-actions">
                <ButtonSwitch
                    value={isEnabled}
                    label="Enabled"
                    on:change={updateWatcherEnabled}
                    design="slider"
                />
                <ButtonDelete deleteAction={deleteWatcher} />
            </div>
        </h3>
        <div class="section">
            <p class="section-1-item">
                <label for="check-interval">Check interval</label>
                <input disabled type="textarea" value={humanCheckInterval} />
            </p>
        </div>

        <div class="section">
            <p class="section-2-item">
                <label for="notification-message">Notification message</label>
                <input disabled type="textarea" value={watcher.notificationMessage} />
            </p>
        </div>

        <div class="section">
            <p class="section-3-item">
                <label for="content">URL</label>
                <a target="_blank" rel="noopener noreferrer" href={watcher.url}>{watcher.url}</a>
            </p>
            {#if watcher.cssSelector}
                <p class="section-3-item">
                    <label for="css-selector">
                        CSS selector
                        <ButtonCopy content={watcher.cssSelector} />
                    </label>
                    <input disabled type="textarea" value={watcher.cssSelector} />
                </p>
            {/if}
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

        {#if watcher.lastErrorDateUnix}
            <div class="section error-section">
                <p class="section-4-item">
                    <label for="last-check">Last error</label>
                    <input
                        disabled
                        type="textarea"
                        value={formatTimestamp(watcher.lastErrorDateUnix)}
                    />
                </p>
                <p class="section-4-item">
                    <label for="last-update">Last error message</label>
                    <input disabled type="textarea" value={watcher.lastErrorMessage} />
                </p>
            </div>
        {/if}

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

    .item-name {
        flex-grow: 1;
    }
    .item-actions {
        display: flex;
        justify-content: space-between;
        column-gap: 1em;
    }

    .section {
        display: flex;
        flex-wrap: wrap;
    }

    .error-section {
        padding: 0.5em;
        border-radius: 5px;
        border: 1px solid var(--nc-error);
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
