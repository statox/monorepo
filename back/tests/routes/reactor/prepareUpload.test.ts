import request from 'supertest';
import { app } from '../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../helpers/index.js';

const validInput = {
    name: 'entry name',
    tags: ['tag1', 'tag2'],
    mimetype: 'image/png',
    sizeBytes: 1234
};

describe('reactor/prepareUpload', () => {
    describe('should fail', () => {
        it('when unauthenticated', async () => {
            await request(app).post('/reactor/prepareUpload').send(validInput).expect(401);
            await th.mysql.checkTableLength('Reactor', 0);
        });

        it('on duplicate name', async () => {
            await th.mysql.fixture({
                Reactor: [
                    {
                        id: 1,
                        name: 'entry name',
                        tags: '[]',
                        creationDateUnix: 10,
                        linkId: 'aabbccdd',
                        s3Key: 'aabbccdd_entry-name.png'
                    }
                ]
            });

            await request(app)
                .post('/reactor/prepareUpload')
                .set('Cookie', th.auth2.getPassportSessionCookie())
                .send(validInput)
                .expect(400)
                .then((response) => {
                    assert.deepEqual(response.body, {
                        httpStatus: 400,
                        code: 'ITEM_ALREADY_EXISTS'
                    });
                });

            await th.mysql.checkTableLength('Reactor', 1);
            await th.mysql.checkTableLength('S3Files', 0);
        });

        const invalidInputs: [string, Record<string, unknown>][] = [
            ['non image mimetype', { ...validInput, mimetype: 'text/html' }],
            ['image mimetype not in the allow list', { ...validInput, mimetype: 'image/svg+xml' }],
            ['file larger than 10 MB', { ...validInput, sizeBytes: 10 * 1024 * 1024 + 1 }],
            ['empty file', { ...validInput, sizeBytes: 0 }],
            ['non integer size', { ...validInput, sizeBytes: 12.5 }],
            ['empty name', { ...validInput, name: '' }]
        ];
        for (const [label, input] of invalidInputs) {
            it(`on ${label}`, async () => {
                await request(app)
                    .post('/reactor/prepareUpload')
                    .set('Cookie', th.auth2.getPassportSessionCookie())
                    .send(input)
                    .expect(400)
                    .then((response) => {
                        assert.equal(response.body.code, 'INPUT_VALIDATION_FAILED');
                    });

                await th.mysql.checkTableLength('Reactor', 0);
                await th.mysql.checkTableLength('S3Files', 0);
            });
        }
    });

    it('should create pending rows and return a URL signed for content type and size', async () => {
        let linkId = '';
        let uploadUrl = '';
        await request(app)
            .post('/reactor/prepareUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send(validInput)
            .expect(200)
            .then((response) => {
                ({ linkId, uploadUrl } = response.body);
            });

        assert.match(linkId, /^[0-9a-f]{8}$/);
        const expectedS3Key = `${linkId}_entry-name.png`;

        const url = new URL(uploadUrl);
        assert.equal(url.pathname, `/reactor/${expectedS3Key}`);
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
            Reactor: [
                {
                    name: 'entry name',
                    linkId,
                    s3Key: expectedS3Key,
                    tags: '["tag1","tag2"]',
                    creationDateUnix: th.mysql.aroundNowSec
                }
            ],
            S3Files: [
                {
                    bucket: 'reactor',
                    s3Key: expectedS3Key,
                    creationDateUnix: th.mysql.aroundNowSec,
                    uploadedDateUnix: null,
                    deletionDateUnix: null
                }
            ]
        });
    });

    it('should use the extension matching the mimetype', async () => {
        await request(app)
            .post('/reactor/prepareUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send({ ...validInput, mimetype: 'image/jpeg' })
            .expect(200)
            .then((response) => {
                assert.match(new URL(response.body.uploadUrl).pathname, /_entry-name\.jpg$/);
            });
    });
});
