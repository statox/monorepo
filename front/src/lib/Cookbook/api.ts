import { client } from '$lib/api';

export const addRecipe = client.cookbook.addRecipe;

export const listRecipes = client.cookbook.listRecipes;

export const listIngedients = client.cookbook.listIngedients;

export const getRecipe = client.cookbook.getRecipe;
