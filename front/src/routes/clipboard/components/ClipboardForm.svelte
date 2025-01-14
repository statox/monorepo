<script lang="ts">
    import { closeModal } from '$lib/components/Modal';
    import { user } from '$lib/auth/service';
    import { ApiError } from '$lib/api';
    import { UserLoggedOutError } from '$lib/auth';
    import { toast } from '$lib/components/Toast';
    import { Notice, type NoticeItem } from '$lib/components/Notice';
    import { DurationPicker } from '$lib/components/DurationPicker';
    import { uploadToClipboard } from '$lib/Clipboard/api';

    export let isOpen: boolean;
    export let onUpload: () => void;
    let noticeMessages: NoticeItem[] = [];

    let name: string;
    let content: string;
    let fileInput: HTMLInputElement;
    let files: FileList | null;
    let isPublic = false;
    let ttlSeconds: number;

    const upload = async () => {
        noticeMessages = [];
        if (!name?.length) {
            noticeMessages.push({ level: 'error', header: 'name must be defined' });
        }
        if (!content?.length) {
            noticeMessages.push({ level: 'error', header: 'content must be defined' });
        }

        if (ttlSeconds < 0) {
            noticeMessages.push({ level: 'error', header: 'TTL must be positive' });
        }

        if (noticeMessages.length) {
            return;
        }

        let file: File | undefined;
        if (files && files.length) {
            file = files[0] || undefined;
        }

        try {
            await uploadToClipboard({ name, content, ttlSeconds, isPublic, file });
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

                <label for="content">Content</label>
                <input type="textarea" bind:value={content} />

                <label for="file">File</label>
                <span>
                    <input class="file-input" type="file" bind:files bind:this={fileInput} />
                    <button
                        aria-label="delete file"
                        on:click={() => {
                            fileInput.value = '';
                        }}
                    >
                        <i class="fas fa-times-circle"></i>
                    </button>
                </span>

                <label for="ttlSeconds">TTL</label>
                <DurationPicker
                    bind:valueInSeconds={ttlSeconds}
                    allowedUnits={['minutes', 'hours', 'days', 'months', 'years']}
                    defaultDuration={{ value: 10, unit: 'minutes' }}
                />

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

    .file-input {
        flex-grow: 2;
    }
    .visibility-status {
        background-color: var(--nc-success);
    }
    .visibility-public {
        background-color: var(--nc-error);
    }
</style>
