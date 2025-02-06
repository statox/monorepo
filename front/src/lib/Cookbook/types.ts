export type RecipeMeta = {
    id: number;
    name: string;
    creationDateUnix: number;
    updateDateUnix: number;
};

export type RecipeToCreate = {
    name: string;
    content: string;
    ingredients: {
        name: string;
        quantity?: number;
        unit?: string;
    }[];
};

export type RecipeFull = RecipeMeta & {
    content: string;
    ingredients: {
        id: number;
        name: string;
        quantity?: number;
        unit?: string;
    }[];
};
