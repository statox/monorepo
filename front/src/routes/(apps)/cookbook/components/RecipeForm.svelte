<script lang="ts">
    import {
        FormLayout,
        FormGrid,
        FormSubmitButton,
        handleFormError
    } from '$lib/components/FormLayout';
    import type { NoticeItem } from '$lib/components/Notice';
    import { addRecipe } from '$lib/Cookbook';
    import IngredientsList from './IngredientsList.svelte';
    import IngredientInput from './IngredientInput.svelte';
    import { toast } from '$lib/components/Toast';

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

        if (noticeMessages.length) {
            return;
        }

        try {
            uploading = true;
            await addRecipe({ name, content, ingredients });
            onUpload();
        } catch (error) {
            handleFormError(error);
        } finally {
            uploading = false;
        }
    };
</script>

<FormLayout title="Add a new recipe" backUrl="/cookbook" {noticeMessages}>
    <FormGrid onsubmit={upload}>
        <label for="name">Name</label>
        <input id="name" type="text" bind:value={name} />

        <label for="new-ingredient">New ingredient</label>
        <div id="new-ingredient">
            <IngredientInput onAdd={addIngredient} />
        </div>

        <label for="ingredients-list">List of ingredients</label>
        <div id="ingredients-list">
            <IngredientsList {ingredients} editable={true} />
        </div>

        <label for="content">Instructions</label>
        <textarea id="content" bind:value={content} rows="10" cols="50"></textarea>

        <FormSubmitButton loading={uploading} />
    </FormGrid>
</FormLayout>
