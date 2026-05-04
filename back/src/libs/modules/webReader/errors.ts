import { AppError } from '../../errors/AppError.js';

export class InvalidUrlError extends AppError {
    constructor() {
        super({ code: 'INVALID_URL', httpStatus: 400 });
    }
}
