import { ErrorCode } from './codes.js';

// AppError is the base class for all known, intentional errors in the application.
// Services throw AppError subclasses to signal business rule violations or expected
// failure conditions (e.g. item not found, duplicate entry, invalid input).
//
// The error middleware checks whether the error's code is listed in the throwing
// route's `clientErrors` whitelist (or in ALWAYS_CLIENT_ERRORS for auth errors).
// Whitelisted errors are forwarded to the client as-is; non-whitelisted AppErrors
// are treated as unexpected failures and return a generic 500 with a Slack alert.
//
// Usage:
//   - Define a subclass in the relevant module's errors.ts file
//   - Add the code string to ERROR_CODES in codes.ts
//   - Add the code to `clientErrors` on every route that intentionally throws it
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
