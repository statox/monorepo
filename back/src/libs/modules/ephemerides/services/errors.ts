import { AppError } from '../../../errors/AppError.js';

export class RangeTooLargeError extends AppError {
    constructor() {
        super({ code: 'RANGE_TOO_LARGE', httpStatus: 400 });
    }
}

export class RangeInvalid extends AppError {
    constructor() {
        super({ code: 'RANGE_IS_INVALID', httpStatus: 400 });
    }
}
