import { AppError } from '../../errors/AppError.js';

export class FileOrContentRequiredError extends AppError {
    constructor() {
        super({ code: 'FILE_OR_CONTENT_REQUIRED', httpStatus: 400 });
    }
}
