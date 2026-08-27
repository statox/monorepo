import { NextFunction, Request, Response } from 'express';
import { AllowedSchema, Validator } from 'express-json-validator-middleware';
import { isProd } from '../../packages/config/sources/env.js';

const validator = new Validator({ allowUnionTypes: true });

// TODO: Fix inputSchema typing
export const validatePostBody = (inputSchema: unknown) => {
    const validatorMiddleware = validator.validate({ body: inputSchema as AllowedSchema });

    return (req: Request, res: Response, next: NextFunction) => {
        if (!isProd) {
            let bodyStr = 'error when parsing body';
            try {
                bodyStr = JSON.stringify(req.body);
            } finally {
                res.locals.loggableContext.addData('requestBody_DANGER', bodyStr);
            }
        }

        return validatorMiddleware(req, res, (error) => {
            if (error) {
                // Reformat/transform error here before passing to next
                next(error);
            } else {
                next();
            }
        });
    };
};
