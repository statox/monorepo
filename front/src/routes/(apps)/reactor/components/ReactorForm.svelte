<script lang="ts">
    import { ApiError } from '$lib/api';
    import { UserLoggedOutError } from '$lib/auth';
    import { toast } from '$lib/components/Toast';
    import { Notice, type NoticeItem } from '$lib/components/Notice';
    import { uploadToReactor } from '$lib/Reactor/api';
    import { AuthGuard } from '$lib/components/AuthGuard';
    import { Spinner } from '$lib/components/Spinner';
    import { goto } from '$app/navigation';

    interface Props {
        onUpload: () => void;
    }

    let { onUpload }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);

    let name: string = $state('');
    let commaSeparatedTags = $state('');
    let fileInput: HTMLInputElement | undefined = $state();
    let files: FileList | undefined = $state();
    let uploading = $state(false);

    const upload = async () => {
        noticeMessages = [];
        if (!name?.length) {
            noticeMessages.push({ level: 'error', header: 'name must be defined' });
        }
        let file: File | undefined;
        if (files && files.length) {
            file = files[0];
        }
        if (!file) {
            noticeMessages.push({ level: 'error', header: 'a file must be uploaded' });
        }

        if (noticeMessages.length || !file) {
            // the !file is not necessary for the logic but without it uploadToReactor() see file as potentially undefined
            return;
        }

        try {
            uploading = true;
            await uploadToReactor({ name, commaSeparatedTags, file });
            uploading = false;
            onUpload();
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
        goto('/reactor');
    };
</script>

<div class="contents">
    <h4 class="title-bar">
        Add a new file
        <button onclick={onClose}>Back</button>
    </h4>

    <AuthGuard message="Login to add an entry" requiredScope="admin">
        {#each noticeMessages as item}
            <Notice {item} />
        {/each}

        <form class="form-content">
            <label for="name">Name</label>
            <input type="text" bind:value={name} />

            <label for="content">Tags</label>
            <input type="textarea" bind:value={commaSeparatedTags} />

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

            <br />

            <button class="form-action" onclick={upload} disabled={uploading}>
                {#if uploading}
                    <Spinner size={0.5} unit="em" durationSeconds={0.5} />
                {:else}
                    Submit
                {/if}
            </button>
        </form>
    </AuthGuard>
</div>

<style>
    .form-action {
        grid-column: span 2;
    }

    .form-content {
        display: grid;
        grid-template-columns: auto auto;
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
</style>
