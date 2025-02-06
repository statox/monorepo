import { requestAPIGet, requestAPIPost } from '$lib/api';
import type { RecipeFull, RecipeMeta, RecipeToCreate } from './types';

export const addRecipe = async (recipe: RecipeToCreate) => {
    return await requestAPIPost({
        path: '/cookbook/addRecipe',
        data: recipe
    });
};

export const listRecipes = async () => {
    return await requestAPIGet<{ recipes: RecipeMeta[] }>({
        authorize: true,
        path: '/cookbook/listRecipes'
    });
};

export const getRecipe = async (id: number) => {
    return await requestAPIPost<RecipeFull>({
        data: { recipeId: id },
        path: '/cookbook/getRecipe'
    });
};
