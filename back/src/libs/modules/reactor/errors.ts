import { AppError } from '../../errors/AppError.js';

export class FileRequiredError extends AppError {
    constructor() {
        super({ code: 'FILE_REQUIRED', httpStatus: 400 });
    }
}
