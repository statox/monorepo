import { AppError } from '../../errors/AppError.js';

export class DuplicateIngredientError extends AppError {
    readonly ingredient: string;
    constructor(ingredient: string) {
        super({
            code: 'DUPLICATE_INGREDIENT',
            httpStatus: 400,
            reason: `Ingredient "${ingredient}" appears more than once`
        });
        this.ingredient = ingredient;
    }
}

export class RecipeNotFoundError extends AppError {
    readonly id: number;
    constructor(id: number) {
        super({ code: 'RECIPE_ID_NOT_FOUND', httpStatus: 400 });
        this.id = id;
    }
}
