import { ErrorCode } from './codes.js';

export class AppError extends Error {
    readonly code: ErrorCode;
    readonly httpStatus: number;
    readonly reason?: string;

    constructor(params: { code: ErrorCode; httpStatus: number; reason?: string }) {
        super(params.code);
        this.code = params.code;
        this.httpStatus = params.httpStatus;
        this.reason = params.reason;
    }
}
