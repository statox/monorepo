import { AppError } from '../../errors/AppError.js';

/**
 * User was likely logged out
 */
export class Auth_UnauthorizedError extends AppError {
    constructor() {
        super({ code: 'UNAUTHORIZED', httpStatus: 401 });
    }
}

/**
 * User doesn't have the right to access the resource
 */
export class Auth_ForbiddenForUserError extends AppError {
    constructor() {
        super({ code: 'FORBIDDEN_FOR_USER', httpStatus: 403 });
    }
}

/**
 * There is a scope configuration issue
 */
export class Auth_InvalidScopeError extends AppError {
    constructor() {
        super({ code: 'INVALID_SCOPE', httpStatus: 401 });
    }
}
