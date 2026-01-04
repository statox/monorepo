<script lang="ts">
    import { ApiError } from '$lib/api';
    import { UserLoggedOutError } from '$lib/auth';
    import { AuthGuard } from '$lib/components/AuthGuard';
    import { Notice, type NoticeItem } from '$lib/components/Notice';
    import { Spinner } from '$lib/components/Spinner';
    import { toast } from '$lib/components/Toast';
    import { addRecipe } from '$lib/Cookbook';
    import { goto } from '$app/navigation';
    import IngredientsList from './IngredientsList.svelte';
    import IngredientInput from './IngredientInput.svelte';

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

    const addIngredient = (params: { name: string; quantity?: number; unit?: string }) => {
        if (ingredients.find((i) => i.name === params.name)) {
            const message = params.name + ' already added';
            toast.push(message, {
                theme: {
                    '--toastBarBackground': '#FF0000'
                }
            });
            return;
        }
        ingredients.push(params);
    };

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
    <span class="title-bar">
        <h2>Add a new recipe</h2>
        <button onclick={() => goto('/cookbook')}>Back to list</button>
    </span>

    <AuthGuard message="Login to add an entry" requiredScope="admin">
        {#each noticeMessages as item}
            <Notice {item} />
        {/each}

        <div class="form-content">
            <label for="name">Name</label>
            <input type="text" bind:value={name} />

            <label for="ingredients">New ingredient</label>
            <div>
                <IngredientInput onAdd={addIngredient} />
            </div>

            <label for="ingredients">List of ingredients</label>
            <div>
                <IngredientsList {ingredients} editable={true} />
            </div>

            <label for="content">Instructions</label>
            <textarea bind:value={content} rows="10" cols="50"></textarea>
        </div>

        <button class="form-action" onclick={upload} disabled={uploading}>
            {#if uploading}
                <Spinner size={0.5} unit="em" durationSeconds={0.5} />
            {:else}
                Submit
            {/if}
        </button>
    </AuthGuard>
</div>

<style>
    .form-action {
        grid-column: span 2;
    }

    .form-content {
        display: grid;
        grid-template-columns: 15% auto;
        grid-row-gap: 1em;
    }

    @media screen and (max-width: 600px) {
        .form-content {
            grid-template-columns: 100%;
        }
    }

    .contents {
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
        align-items: baseline;
    }
    .title-bar > button {
        max-height: 2em;
    }
</style>
