import { AppError } from '../../errors/AppError.js';

export class DuplicateIngredientError extends AppError {
    constructor(readonly ingredient: string) {
        super({
            code: 'DUPLICATE_INGREDIENT',
            httpStatus: 400,
            reason: `Ingredient "${ingredient}" appears more than once`
        });
    }
}

export class RecipeNotFoundError extends AppError {
    constructor(id: number) {
        super({ code: 'ITEM_NOT_FOUND', httpStatus: 400, reason: `Recipe ${id} not found` });
    }
}
