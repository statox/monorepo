import { QueryError } from 'mysql2/promise';
import { AppError } from './AppError.js';
import { ErrorCode } from './codes.js';

// Use this in catch blocks after INSERT queries to convert MySQL duplicate-key
// errors (ER_DUP_ENTRY) into the appropriate AppError. Any other error is
// re-thrown unchanged so it surfaces as an unexpected 500.
// If the INSERT is inside a transaction, call conn.rollback() before this.
export function handleDuplicateEntry(error: unknown, code: ErrorCode): never {
    if ((error as QueryError).code === 'ER_DUP_ENTRY') {
        throw new AppError({ code, httpStatus: 400 });
    }
    throw error as Error;
}
