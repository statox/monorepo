import { AppError } from '../../errors/AppError.js';

export class ChordNotFoundError extends AppError {
    constructor() {
        super({ code: 'ITEM_NOT_FOUND', httpStatus: 400 });
    }
}
