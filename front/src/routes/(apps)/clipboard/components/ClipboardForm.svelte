<script lang="ts">
    import { user } from '$lib/auth2';
    import { ApiError } from '$lib/api';
    import { UserLoggedOutError } from '$lib/auth';
    import { toast } from '$lib/components/Toast';
    import { Spinner } from '$lib/components/Spinner';
    import { Notice, type NoticeItem } from '$lib/components/Notice';
    import { DurationPicker } from '$lib/components/DurationPicker';
    import { uploadToClipboard } from '$lib/Clipboard/api';
    import { goto } from '$app/navigation';

    interface Props {
        onUpload: () => void;
    }

    let { onUpload }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);

    let name: string = $state('');
    let content: string = $state('');
    let fileInput: HTMLInputElement | undefined = $state();
    let files: FileList | undefined = $state();
    let isPublic = $state(false);
    let ttlSeconds: number = $state(0);
    let uploading = $state(false);
    let uploadSucess = $state(false);

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
            uploading = true;
            uploadSucess = false;
            await uploadToClipboard({ name, content, ttlSeconds, isPublic, file });
            uploading = false;
            onUpload();
            uploadSucess = true;
        } catch (error) {
            uploading = false;
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

    const onClose = () => {
        goto('/clipboard/');
    };
</script>

<div class="contents">
    <h4 class="title-bar">
        Add a new clipboard entry
        <button onclick={onClose}>Back</button>
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
                onclick={() => {
                    if (fileInput !== undefined) {
                        fileInput.value = '';
                    }
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
            onclick={() => (isPublic = !isPublic)}
        >
            {#if isPublic}
                Public
                <i class="fas fa-lock-open"></i>
            {:else}
                Private
                <i class="fas fa-lock"></i>
            {/if}
        </button>
    </form>

    {#if $user}
        <button class="form-action" onclick={upload} disabled={uploading}>
            {#if uploading}
                <Spinner size={0.5} unit="em" durationSeconds={0.5} />
            {:else}
                Submit
            {/if}
        </button>
        {#if uploadSucess}
            <i class="sucess-indicator fas fa-check"></i>
        {/if}
    {:else}
        <span class="form-action">Login to upload an entry</span>
    {/if}
</div>

<style>
    .form-content {
        display: grid;
        grid-template-columns: auto auto;
    }

    @media screen and (max-width: 600px) {
        .form-content {
            grid-template-columns: repeat(1, 1fr);
        }
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
        max-width: 150px;
    }
    .visibility-public {
        background-color: var(--nc-error);
    }

    .sucess-indicator {
        color: var(--nc-success);
    }
</style>
