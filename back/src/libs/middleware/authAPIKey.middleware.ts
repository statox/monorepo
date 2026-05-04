import { NextFunction, Request, Response } from 'express';
import { db } from '../databases/db.js';
import { RowDataPacket } from 'mysql2/promise';
import { slog } from '../modules/logging/index.js';
import { AppError } from '../errors/AppError.js';

/*
 * Generic API Key authentication middleware.
 *
 * This middleware validates requests by checking that the client sends an
 * `Authorization` header of the form `Bearer API-KEY` where API-KEY matches
 * any row in the `ApiKeys` table.
 *
 * Unlike `authIOT.middleware.ts` which is purpose-built for IoT sensors and
 * caches a single hard-coded key (id=1), this middleware is a general-purpose
 * alternative suitable for any client that needs API key authentication.
 *
 * Usage: set `authentication: 'apikey'` on a route definition.
 */

interface ApiKeyRow extends RowDataPacket {
    accessKey: string;
}

export const validateAPIKey = async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    let error;
    if (!authHeader) {
        error = new MissingApiKeyError();
    } else {
        const [scheme, token] = authHeader.split(' ');

        if (scheme !== 'Bearer') {
            error = new InvalidAuthHeaderError();
        } else {
            const [rows] = await db.query<ApiKeyRow[]>(
                `SELECT accessKey FROM ApiKeys WHERE accessKey = ?`,
                [token]
            );

            if (rows.length === 0) {
                error = new UnknownApiKeyError();
            }
        }
    }

    if (error) {
        slog.log('auth', 'authAPIKey rejected', { error });
    }

    return next(error);
};

export class ApiKeyError extends AppError {}

export class MissingApiKeyError extends ApiKeyError {
    constructor() {
        super({ code: 'MISSING_API_KEY', httpStatus: 401 });
    }
}

export class InvalidAuthHeaderError extends ApiKeyError {
    constructor() {
        super({ code: 'INVALID_AUTH_HEADER', httpStatus: 401 });
    }
}

export class UnknownApiKeyError extends ApiKeyError {
    constructor() {
        super({ code: 'UNKNOWN_API_KEY', httpStatus: 403 });
    }
}
