<script lang="ts">
    import { closeModal } from '$lib/components/Modal';
    import { user } from '$lib/auth/service';
    import { ApiError } from '$lib/api';
    import { UserLoggedOutError } from '$lib/auth';
    import { toast } from '$lib/components/Toast';
    import { Notice, type NoticeItem } from '$lib/components/Notice';
    import { uploadToReactor } from '$lib/Reactor/api';

    export let isOpen: boolean;
    export let onUpload: () => void;
    let noticeMessages: NoticeItem[] = [];

    let name: string;
    let commaSeparatedTags = '';
    let fileInput: HTMLInputElement;
    let files: FileList | null;

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
            await uploadToReactor({ name, commaSeparatedTags, file });
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
                Add a new file
                <button on:click={closeModal}>Close</button>
            </h4>

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
                        on:click={() => {
                            fileInput.value = '';
                        }}
                    >
                        <i class="fas fa-times-circle"></i>
                    </button>
                </span>

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

    .file-input {
        flex-grow: 2;
    }
</style>
