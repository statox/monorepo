export type RecipeMeta = {
    id: number;
    name: string;
    creationDateUnix: number;
    updateDateUnix: number;
};

export type IngredientMeta = {
    id: number;
    name: string;
};

export type RecipeFull = RecipeMeta & {
    content: string;
    ingredients: {
        id: number;
        name: string;
        quantity?: number | null;
        unit?: string | null;
    }[];
};
