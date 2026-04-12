import { NextFunction, Request, Response } from 'express';
import { db } from '../databases/db.js';
import { RowDataPacket } from 'mysql2/promise';
import { slog } from '../modules/logging/index.js';
/*
 * IOT API Key authentication middleware.
 *
 * This middleware implement a very basic authentication via api key.
 *
 * It is meant to be used by my home made sensors calling the /homeTracker/upload endoints.
 * Note
 *  - I want these sensors to be extremely battery efficient and to do as few computation
 *    as possible with each call
 *  - The endpoint enforces a JSON schema to validate the client inputs
 *  - It seems I have very few bots traffic on my endpoints and the /homeTracker/upload
 *    endpoint isn't very sensitive
 *
 * For these reasons the "api key" authentication limits itself to checking that the clients
 * send a `Authorization` header of the form `Bearer API-KEY` where API-KEY is defined in db.
 *
 * If I end up needing other types of clients using API key auth I'll need to re-think another
 * middleware with better security. For now, this is good enough.
 *
 */

// Import and re-export error classes so existing consumers are not broken
import {
    ApiKeyError as _ApiKeyError,
    MissingApiKeyError,
    InvalidAuthHeaderError,
    UnknownApiKeyError
} from './authAPIKey.middleware.js';
export {
    _ApiKeyError as ApiKeyError,
    MissingApiKeyError,
    InvalidAuthHeaderError,
    UnknownApiKeyError
};

let IOT_API_KEY: string;

interface apiKeyResult extends RowDataPacket {
    accessKey: string;
}

const getAPIKey = async () => {
    if (IOT_API_KEY) {
        return IOT_API_KEY;
    }

    const [rows] = await db.query<apiKeyResult[]>(`SELECT accessKey FROM ApiKeys WHERE id = 1`);
    if (!rows || rows.length !== 1) {
        throw new Error('API KEY NOT FOUND');
    }
    IOT_API_KEY = rows[0].accessKey;
    return IOT_API_KEY;
};

export const validateAPIKeyHeader = async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    let error;
    if (!authHeader) {
        error = new MissingApiKeyError();
    } else {
        const [scheme, token] = authHeader.split(' ');

        if (scheme !== 'Bearer') {
            error = new InvalidAuthHeaderError();
        } else {
            const apiKey = await getAPIKey();
            if (token !== apiKey) {
                error = new UnknownApiKeyError();
            }
        }
    }

    if (error) {
        slog.log('auth', 'authIOT rejected', { error });
    }

    return next(error);
};
