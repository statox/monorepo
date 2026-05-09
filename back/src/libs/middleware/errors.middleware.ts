import { NextFunction, Request, Response } from 'express';
import { ValidationError } from 'express-json-validator-middleware';
import { AppError } from '../errors/AppError.js';
import { ALWAYS_CLIENT_ERRORS, ErrorCode } from '../errors/codes.js';
import { Route } from '../routes/types.js';
import { slackNotifier } from '../modules/notifier/slack.js';
import { slog } from '../modules/logging/slog.js';

type ErrorResponse = {
    httpStatus: number;
    code: ErrorCode;
    reason?: string;
};

// Express identifies error-handling middleware by its 4-parameter signature.
// _next must remain even though it is never called.
export const errorHandler = async (
    error: Error,
    request: Request,
    response: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
): Promise<void> => {
    const route = response.locals.route as Route<unknown, unknown> | undefined;

    response.locals.loggableContext?.addData('error', error);

    // Input validation errors from express-json-validator-middleware
    if (error instanceof ValidationError) {
        slog.log('middleware', 'Input validation error', { url: request.url });
        const body: ErrorResponse = {
            httpStatus: 400,
            code: 'INPUT_VALIDATION_FAILED',
            reason: JSON.stringify(error.validationErrors)
        };
        response.status(400).json(body);
        return;
    }

    // All AppErrors (business, auth, system)
    if (error instanceof AppError) {
        const isAlwaysForwarded = ALWAYS_CLIENT_ERRORS.has(error.code);
        const isDeclaredByRoute = Boolean(route?.clientErrors?.includes(error.code));
        const isClientError = isAlwaysForwarded || isDeclaredByRoute;

        slog.log('middleware', isClientError ? 'Client error' : 'Unexpected AppError', {
            url: request.url,
            error,
            errorCode: error.code
        });

        if (!isClientError) {
            slackNotifier.notifySlack({
                error,
                message: `Unexpected AppError ${error.code} on ${request.url}`
            });
            response.status(500).json({
                httpStatus: 500,
                code: 'INTERNAL_SERVER_ERROR'
            } satisfies ErrorResponse);
            return;
        }

        const body: ErrorResponse = { httpStatus: error.httpStatus, code: error.code };
        if (error.reason) body.reason = error.reason;
        response.status(error.httpStatus).json(body);
        return;
    }

    // Unrecognized error — unexpected failure
    slog.log('middleware', 'Unexpected error', { url: request.url, error });
    slackNotifier.notifySlack({ error, message: `Unexpected error on ${request.url}` });
    response.status(500).json({
        httpStatus: 500,
        code: 'INTERNAL_SERVER_ERROR'
    } satisfies ErrorResponse);
};
