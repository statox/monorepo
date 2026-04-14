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
    let fieldErrors: Record<string, string> = $state({});
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

    const validateName = () => {
        fieldErrors.name = name?.length ? '' : 'Name is required';
    };

    const validateContent = () => {
        fieldErrors.content = content?.length ? '' : 'Instructions are required';
    };

    const upload = async () => {
        noticeMessages = [];
        validateName();
        validateContent();

        if (Object.values(fieldErrors).some((e) => e)) {
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
        <input id="name" type="text" bind:value={name} onblur={validateName} />
        {#if fieldErrors.name}
            <span class="field-error">{fieldErrors.name}</span>
        {/if}

        <label for="new-ingredient">New ingredient</label>
        <div id="new-ingredient">
            <IngredientInput onAdd={addIngredient} />
        </div>

        <label for="ingredients-list">List of ingredients</label>
        <div id="ingredients-list">
            <IngredientsList {ingredients} editable={true} />
        </div>

        <label for="content">Instructions</label>
        <textarea id="content" bind:value={content} rows="10" cols="50" onblur={validateContent}
        ></textarea>
        {#if fieldErrors.content}
            <span class="field-error">{fieldErrors.content}</span>
        {/if}

        <FormSubmitButton loading={uploading} />
    </FormGrid>
</FormLayout>
