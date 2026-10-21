import request from 'supertest';
import { app } from '../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../helpers/index.js';

const validInput = {
    name: 'entry name',
    mimetype: 'image/png',
    sizeBytes: 1234
};

describe('clipboard/prepareUpload', () => {
    describe('should fail', () => {
        it('when unauthenticated', async () => {
            await request(app).post('/clipboard/prepareUpload').send(validInput).expect(401);
            await th.mysql.checkTableLength('Clipboard', 0);
        });

        it('on duplicate name', async () => {
            await th.mysql.fixture({
                Clipboard: [
                    {
                        id: 1,
                        name: 'entry name',
                        content: 'foo',
                        creationDateUnix: 10,
                        ttl: 100,
                        linkId: 'aabbccdd'
                    }
                ]
            });

            await request(app)
                .post('/clipboard/prepareUpload')
                .set('Cookie', th.auth2.getPassportSessionCookie())
                .send(validInput)
                .expect(400)
                .then((response) => {
                    assert.deepEqual(response.body, {
                        httpStatus: 400,
                        code: 'ITEM_ALREADY_EXISTS'
                    });
                });

            await th.mysql.checkTableLength('Clipboard', 1);
            await th.mysql.checkTableLength('S3Files', 0);
        });

        const invalidInputs: [string, Record<string, unknown>][] = [
            ['file larger than 5 MB', { ...validInput, sizeBytes: 5 * 1024 * 1024 + 1 }],
            ['empty file', { ...validInput, sizeBytes: 0 }],
            ['non integer size', { ...validInput, sizeBytes: 12.5 }],
            ['empty name', { ...validInput, name: '' }],
            ['empty mimetype', { ...validInput, mimetype: '' }],
            ['negative ttl', { ...validInput, ttlSeconds: -1 }]
        ];
        for (const [label, input] of invalidInputs) {
            it(`on ${label}`, async () => {
                await request(app)
                    .post('/clipboard/prepareUpload')
                    .set('Cookie', th.auth2.getPassportSessionCookie())
                    .send(input)
                    .expect(400)
                    .then((response) => {
                        assert.equal(response.body.code, 'INPUT_VALIDATION_FAILED');
                    });

                await th.mysql.checkTableLength('Clipboard', 0);
                await th.mysql.checkTableLength('S3Files', 0);
            });
        }
    });

    it('should create pending rows and return a URL signed for content type and size', async () => {
        let linkId = '';
        let uploadUrl = '';
        await request(app)
            .post('/clipboard/prepareUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send(validInput)
            .expect(200)
            .then((response) => {
                ({ linkId, uploadUrl } = response.body);
            });

        assert.match(linkId, /^[0-9a-f]{8}$/);
        const expectedS3Key = `${linkId}_entry-name.png`;

        const url = new URL(uploadUrl);
        assert.equal(url.pathname, `/clipboard/${expectedS3Key}`);
        assert.equal(
            url.searchParams.get('X-Amz-SignedHeaders'),
            'content-length;content-type;host'
        );
        assert.equal(url.searchParams.get('X-Amz-Expires'), '900');
        // R2 validates checksums in presigned URLs: an empty-body CRC32 must never be signed
        assert.isNull(url.searchParams.get('x-amz-checksum-crc32'));
        assert.isNull(url.searchParams.get('x-amz-sdk-checksum-algorithm'));

        // Signing is local: nothing is sent to S3
        th.s3.checkNbCalls({ nbCalls: 0 });

        await th.mysql.checkContains({
            Clipboard: [
                {
                    name: 'entry name',
                    linkId,
                    s3Key: expectedS3Key,
                    // The listing routes require a string: never store NULL
                    content: '',
                    ttl: 60 * 5,
                    isPublic: 0,
                    creationDateUnix: th.mysql.aroundNowSec
                }
            ],
            S3Files: [
                {
                    bucket: 'clipboard',
                    s3Key: expectedS3Key,
                    creationDateUnix: th.mysql.aroundNowSec,
                    uploadedDateUnix: null,
                    deletionDateUnix: null
                }
            ]
        });
    });

    it('should store the optional content, ttl and visibility', async () => {
        await request(app)
            .post('/clipboard/prepareUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send({ ...validInput, content: 'some text', ttlSeconds: 60, isPublic: true })
            .expect(200);

        await th.mysql.checkContains({
            Clipboard: [{ name: 'entry name', content: 'some text', ttl: 60, isPublic: 1 }]
        });
    });

    it('should use the extension matching the mimetype', async () => {
        await request(app)
            .post('/clipboard/prepareUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send({ ...validInput, mimetype: 'image/jpeg' })
            .expect(200)
            .then((response) => {
                assert.match(new URL(response.body.uploadUrl).pathname, /_entry-name\.jpg$/);
            });
    });

    it('should accept a mimetype with no known extension', async () => {
        await request(app)
            .post('/clipboard/prepareUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send({ ...validInput, mimetype: 'application/x-unknown-thing' })
            .expect(200)
            .then((response) => {
                assert.match(new URL(response.body.uploadUrl).pathname, /_entry-name$/);
            });
    });
});
