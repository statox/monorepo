import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';

const upload = multer({
    storage: multer.diskStorage({
        destination: '/tmp/',
        filename: (req, file, cb) => {
            const unique = `${Date.now()}-${crypto.randomUUID()}`;
            cb(null, unique + path.extname(file.originalname));
        }
    }),
    // storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    }
    // The `fileFilter` makes multer ignore the unwanted mimetypes.
    // Disabled for now as I want to be flexible with clipboard
    // fileFilter: (req, file, cb) => {
    //     const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'text/plain'];
    //     if (!allowed.includes(file.mimetype)) {
    //         slog.log('middleware', 'Invalid mimetype rejected', {mimetype: file.mimetype});
    //         return cb(new Error('Unsupported file type'));
    //     }
    //     cb(null, true);
    // }
});

// Middleware to parse multipart content and put it in the request body
export const multipartHandler = (req: Request, res: Response, next: NextFunction) => {
    const isMultipart =
        req.headers['content-type'] && req.headers['content-type'].indexOf('multipart') !== -1;

    if (!isMultipart) {
        return next();
    }

    // TODO Add validation in 3rd param (function wrapping `next()`)
    // - Allow routes to define if the file is required or not
    // - Add per-route limits validation (file size, mime type) ?
    //
    // `'file'` defines the property name the front must define in the form
    // to send the file's content.
    return upload.single('file')(req, res, next);
};
