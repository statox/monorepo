import request from 'supertest';
import { app } from '../../src/app.js';
import { assert } from 'chai';

describe('multipart middleware', () => {
    it('should return 400 FILE_TOO_LARGE when file exceeds 5 MB', async () => {
        const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1); // 5 MB + 1 byte

        await request(app)
            .post('/postroutewithfile')
            .attach('file', largeBuffer, { filename: 'large.txt', contentType: 'text/plain' })
            .expect(400)
            .then((response) => {
                assert.deepEqual(response.body, { httpStatus: 400, code: 'FILE_TOO_LARGE' });
            });
    });

    it('should return 400 INPUT_VALIDATION_FAILED when file is sent with wrong field name', async () => {
        await request(app)
            .post('/postroutewithfile')
            .attach('attachment', Buffer.from('some data'), {
                filename: 'file.txt',
                contentType: 'text/plain'
            })
            .expect(400)
            .then((response) => {
                assert.deepEqual(response.body, {
                    httpStatus: 400,
                    code: 'INPUT_VALIDATION_FAILED'
                });
            });
    });
});
