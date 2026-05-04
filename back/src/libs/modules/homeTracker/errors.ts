import { AppError } from '../../errors/AppError.js';

export class SensorNotFoundError extends AppError {
    constructor() {
        super({ code: 'SENSOR_NOT_FOUND', httpStatus: 400 });
    }
}
