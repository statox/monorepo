<script lang="ts">
    import { user } from '$lib/auth/service';
    import { ApiError } from '$lib/api';
    import { UserLoggedOutError } from '$lib/auth';
    import { Notice, type NoticeItem } from '$lib/components/Notice';
    import { Spinner } from '$lib/components/Spinner';
    import { toast } from '$lib/components/Toast';
    import { addRecipe } from '$lib/Cookbook';
    import { goto } from '$app/navigation';

    interface Props {
        onUpload: () => void;
    }

    let { onUpload }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);
    let uploading = $state(false);

    type IngredientForApi = {
        name: string;
        quantity?: number;
        unit?: string;
    };

    let name: string = $state('');
    let content: string = $state('');
    let ingredients: IngredientForApi[] = $state([]);

    const upload = async () => {
        noticeMessages = [];
        if (!name?.length) {
            noticeMessages.push({ level: 'error', header: 'Name must be defined' });
        }
        if (!content?.length) {
            noticeMessages.push({ level: 'error', header: 'Content must be defined' });
        }

        // if (ingredients?.length) {
        //     noticeMessages.push({ level: 'error', header: 'Some ingredients must be defined' });
        // }

        if (noticeMessages.length) {
            return;
        }

        try {
            uploading = true;
            await addRecipe({ name, content, ingredients });
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
</script>

<div class="contents">
    <h4 class="title-bar">Add a new recipe</h4>
    <button onclick={() => goto('/cookbook')}>Back to list</button>

    {#each noticeMessages as item}
        <Notice {item} />
    {/each}

    <form class="form-content">
        <label for="name">Name</label>
        <input type="text" bind:value={name} />

        <label for="content">Content</label>
        <textarea bind:value={content} rows="10" cols="50"></textarea>

        <br />

        {#if $user}
            <button class="form-action" onclick={upload} disabled={uploading}>
                {#if uploading}
                    <Spinner size={0.5} unit="em" durationSeconds={0.5} />
                {:else}
                    Submit
                {/if}
            </button>
        {:else}
            <span class="form-action">Login to upload an entry</span>
        {/if}
    </form>
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
</style>
