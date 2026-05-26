import { AppError } from '../../errors/AppError.js';

export class SensorNotFoundError extends AppError {
    constructor() {
        super({ code: 'SENSOR_NOT_FOUND', httpStatus: 400 });
    }
}

export class InvalidTimeWindowError extends AppError {
    constructor() {
        super({ code: 'INVALID_TIME_WINDOW', httpStatus: 400 });
    }
}
