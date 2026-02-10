export class RangeTooLargeError extends Error {
    constructor() {
        super('RANGE_TOO_LARGE');
    }
}

export class RangeInvalid extends Error {
    constructor() {
        super('RANGE_IS_INVALID');
    }
}
