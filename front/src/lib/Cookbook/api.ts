import { requestAPIGet, requestAPIPost } from '$lib/api';
import type { IngredientMeta, RecipeFull, RecipeMeta, RecipeToCreate } from './types';

export const addRecipe = async (recipe: RecipeToCreate) => {
    return await requestAPIPost({
        path: '/cookbook/addRecipe',
        data: recipe
    });
};

export const listRecipes = async () => {
    return await requestAPIGet<{ recipes: RecipeMeta[] }>({
        path: '/cookbook/listRecipes'
    });
};

export const listIngedients = async () => {
    return await requestAPIGet<{ ingredients: IngredientMeta[] }>({
        path: '/cookbook/listIngredients'
    });
};

export const getRecipe = async (id: number) => {
    return await requestAPIPost<RecipeFull>({
        data: { recipeId: id },
        path: '/cookbook/getRecipe'
    });
};
