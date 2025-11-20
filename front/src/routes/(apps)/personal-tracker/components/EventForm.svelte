<script lang="ts">
    import type { ModalProps } from 'svelte-modals';
    import { user } from '$lib/auth';
    import { ApiError } from '$lib/api';
    import { UserLoggedOutError } from '$lib/auth';
    import { toast } from '$lib/components/Toast';
    import { Notice, type NoticeItem } from '$lib/components/Notice';
    import { createEvent } from '$lib/PersonalTracker/api';
    import { DateTime } from 'luxon';

    interface Props extends ModalProps {
        onUpload: () => void;
    }

    let { isOpen, close, onUpload }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);

    let value: number = $state(0);

    const upload = async () => {
        noticeMessages = [];
        if (value !== Number(value.toFixed(1))) {
            noticeMessages.push({
                level: 'error',
                header: 'Value have at most 1 number after the comma'
            });
        }
        if (value < 80 || value > 110) {
            noticeMessages.push({ level: 'error', header: 'Value must be in kg' });
        }

        if (noticeMessages.length) {
            return;
        }

        const timestampUTC = DateTime.now().toUTC().toUnixInteger();
        try {
            await createEvent({
                event: {
                    timestampUTC,
                    type: 'weight',
                    value: Math.floor(value * 100)
                }
            });
            onUpload();
            close();
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
                Add a new event
                <button onclick={close}>Close</button>
            </h4>

            {#each noticeMessages as item}
                <Notice {item} />
            {/each}

            <form class="form-content">
                <label for="weight">Weight</label>
                <input type="number" step="0.1" bind:value />

                <br />
                {#if $user}
                    <button class="form-action" onclick={upload}>Submit</button>
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
        background: var(--nc-bg-1);
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
