import { QueryError } from 'mysql2/promise';
import { AppError } from './AppError.js';
import { ErrorCode } from './codes.js';

export function handleDuplicateEntry(error: unknown, code: ErrorCode): never {
    if ((error as QueryError).code === 'ER_DUP_ENTRY') {
        throw new AppError({ code, httpStatus: 400 });
    }
    throw error as Error;
}
