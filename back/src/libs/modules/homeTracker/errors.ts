import { AppError } from '../../errors/AppError.js';

export class SensorDoesNotExistError extends AppError {
    constructor() {
        super({ code: 'SENSOR_NAME_DOES_NOT_EXISTS', httpStatus: 400 });
    }
}
