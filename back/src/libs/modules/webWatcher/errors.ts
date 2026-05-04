import { AppError } from '../../errors/AppError.js';

export class EntryAlreadyExistsError extends AppError {
    constructor() {
        super({ code: 'ENTRY_ALREADY_EXISTS', httpStatus: 400 });
    }
}
