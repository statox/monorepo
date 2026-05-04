import { AppError } from '../errors/AppError.js';

export class FileOrContentRequiredError extends AppError {
    constructor() {
        super({ code: 'FILE_OR_CONTENT_REQUIRED', httpStatus: 400 });
    }
}

export class ItemAlreadyExistsError extends AppError {
    constructor() {
        super({ code: 'ITEM_ALREADY_EXISTS', httpStatus: 400 });
    }
}

export class ItemNotFoundError extends AppError {
    constructor() {
        super({ code: 'ITEM_NOT_FOUND', httpStatus: 400 });
    }
}

export class ExpiredItemError extends AppError {
    constructor() {
        super({ code: 'ITEM_IS_EXPIRED', httpStatus: 400 });
    }
}

export class TooManyEntriesError extends AppError {
    constructor() {
        super({ code: 'TOO_MANY_ENTRIES', httpStatus: 400 });
    }
}
