<script lang="ts">
    import { closeModal } from '$lib/components/Modal';
    import { user } from '$lib/auth/service';
    import { ApiError } from '$lib/api';
    import { UserLoggedOutError } from '$lib/auth';
    import { toast } from '$lib/components/Toast';
    import { Notice, type NoticeItem } from '$lib/components/Notice';
    import { DurationPicker } from '$lib/components/DurationPicker';
    import { createWatcher } from '$lib/WebWatcher/api';
    import type { WatchType } from '$lib/WebWatcher/types';

    export let isOpen: boolean;
    export let onUpload: () => void;
    let noticeMessages: NoticeItem[] = [];

    let name: string;
    let notificationMessage: string;
    let url: string;
    let cssSelector: string;
    let checkIntervalSeconds: number;
    let watchType: WatchType;

    const upload = async () => {
        noticeMessages = [];
        if (!name?.length) {
            noticeMessages.push({ level: 'error', header: 'name must be defined' });
        }
        if (!notificationMessage) {
            noticeMessages.push({ level: 'error', header: 'notification message must be defined' });
        }

        if (watchType === 'CSS' && !cssSelector) {
            noticeMessages.push({
                level: 'error',
                header: 'A CSS watcher must have a css selector defined'
            });
        }

        if (checkIntervalSeconds < 15 * 60) {
            noticeMessages.push({
                level: 'error',
                header: 'Check interval too small. Must be >= 15mn'
            });
        }

        try {
            new URL(url);
        } catch (error) {
            noticeMessages.push({ level: 'error', header: 'The URL is invalid' });
        }

        if (noticeMessages.length) {
            return;
        }

        try {
            if (watchType === 'CSS') {
                await createWatcher({
                    name,
                    notificationMessage,
                    url,
                    cssSelector,
                    checkIntervalSeconds,
                    watchType
                });
            } else if (watchType === 'HASH') {
                await createWatcher({
                    name,
                    notificationMessage,
                    url,
                    checkIntervalSeconds,
                    watchType
                });
            }
            onUpload();
            closeModal();
        } catch (error) {
            let errorMessage = (error as Error).message;
            if (error instanceof ApiError && error.code === 401) {
                errorMessage = 'Invalid logged in user';
            } else if (error instanceof UserLoggedOutError) {
                errorMessage = 'User is logged out';
            }
            const message = `<strong>Entry not created</strong><br/> ${errorMessage}`;
            toast.push(message, {
                theme: {
                    '--toastBarBackground': '#FF0000'
                }
            });
        }
    };
</script>

{#if isOpen}
    <div role="dialog" class="modal">
        <div class="contents">
            <h4 class="title-bar">
                Add a new clipboard entry
                <button on:click={closeModal}>Close</button>
            </h4>

            {#each noticeMessages as item}
                <Notice {item} />
            {/each}

            <form class="form-content">
                <label for="name">Name</label>
                <input type="text" bind:value={name} />

                <label for="check-interval">Check interval</label>
                <DurationPicker
                    bind:valueInSeconds={checkIntervalSeconds}
                    allowedUnits={['minutes', 'hours', 'days']}
                    defaultDuration={{ value: 1, unit: 'hours' }}
                />

                <label for="notification-message">
                    Notification message (the @mention is automatically added)
                </label>
                <input type="textarea" bind:value={notificationMessage} />

                <label for="watch-type"> Watcher type </label>
                <select id="watch-type" bind:value={watchType}>
                    <option value="CSS">CSS</option>
                    <option value="HASH">HASH</option>
                </select>

                <label for="content">URL</label>
                <input type="textarea" bind:value={url} />

                {#if watchType === 'CSS'}
                    <label for="css-selector">CSS selector</label>
                    <input type="textarea" bind:value={cssSelector} />
                {/if}

                <br />
                {#if $user}
                    <button class="form-action" on:click={upload}>Submit</button>
                {:else}
                    <span class="form-action">Login to upload an entry</span>
                {/if}
            </form>
        </div>
    </div>
{/if}

<style>
    .form-action {
        grid-column: span 2;
    }

    .form-content {
        display: grid;
        grid-template-columns: auto auto;
    }

    .modal {
        position: fixed;
        top: 0;
        bottom: 0;
        right: 0;
        left: 0;
        margin: 3em;
        z-index: 9999;
        max-width: 900px;

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
