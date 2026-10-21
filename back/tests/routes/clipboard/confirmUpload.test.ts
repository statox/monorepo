import request from 'supertest';
import { app } from '../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../helpers/index.js';

const pendingFixture = (s3Key: string, uploadedDateUnix: number | null = null) => ({
    Clipboard: [
        {
            id: 1,
            name: 'entry name',
            content: '',
            creationDateUnix: th.mysql.nowSec(),
            ttl: 100,
            linkId: 'aabbccdd',
            isPublic: true,
            s3Key
        }
    ],
    S3Files: [{ bucket: 'clipboard', s3Key, creationDateUnix: 10, uploadedDateUnix }]
});

describe('clipboard/confirmUpload', () => {
    describe('should fail', () => {
        it('when unauthenticated', async () => {
            await request(app)
                .post('/clipboard/confirmUpload')
                .send({ linkId: 'aabbccdd' })
                .expect(401);
        });

        it('on unknown linkId', async () => {
            await th.mysql.fixture({ Clipboard: [] });

            await request(app)
                .post('/clipboard/confirmUpload')
                .set('Cookie', th.auth2.getPassportSessionCookie())
                .send({ linkId: 'aabbccdd' })
                .expect(400)
                .then((response) => {
                    assert.deepEqual(response.body, { httpStatus: 400, code: 'ITEM_NOT_FOUND' });
                });

            th.s3.checkNbCalls({ nbCalls: 0 });
        });

        it('on a text entry without file', async () => {
            await th.mysql.fixture({
                Clipboard: [
                    {
                        id: 1,
                        name: 'text entry',
                        content: 'foo',
                        creationDateUnix: 10,
                        ttl: 100,
                        linkId: 'aabbccdd'
                    }
                ]
            });

            await request(app)
                .post('/clipboard/confirmUpload')
                .set('Cookie', th.auth2.getPassportSessionCookie())
                .send({ linkId: 'aabbccdd' })
                .expect(400)
                .then((response) => {
                    assert.deepEqual(response.body, { httpStatus: 400, code: 'ITEM_NOT_FOUND' });
                });

            th.s3.checkNbCalls({ nbCalls: 0 });
        });

        it('when the object is not in the bucket - row stays pending', async () => {
            await th.mysql.fixture(pendingFixture('aabbccdd_notuploaded.png'));

            await request(app)
                .post('/clipboard/confirmUpload')
                .set('Cookie', th.auth2.getPassportSessionCookie())
                .send({ linkId: 'aabbccdd' })
                .expect(400)
                .then((response) => {
                    assert.deepEqual(response.body, { httpStatus: 400, code: 'UPLOAD_NOT_FOUND' });
                });

            await th.mysql.checkContains({
                S3Files: [{ s3Key: 'aabbccdd_notuploaded.png', uploadedDateUnix: null }]
            });
        });
    });

    it('should mark the file uploaded after checking it exists', async () => {
        await th.mysql.fixture(pendingFixture('aabbccdd_entry-name.png'));

        await request(app)
            .post('/clipboard/confirmUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send({ linkId: 'aabbccdd' })
            .expect(200);

        th.s3.checkNbCalls({ nbCalls: 1 });
        th.s3.checkCall({
            commandType: 'HeadObject',
            input: { Bucket: 'clipboard', Key: 'aabbccdd_entry-name.png' }
        });

        await th.mysql.checkContains({
            S3Files: [{ s3Key: 'aabbccdd_entry-name.png', uploadedDateUnix: th.mysql.aroundNowSec }]
        });
    });

    it('should be idempotent on an already confirmed file', async () => {
        await th.mysql.fixture(pendingFixture('aabbccdd_entry-name.png', 20));

        await request(app)
            .post('/clipboard/confirmUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send({ linkId: 'aabbccdd' })
            .expect(200);

        await th.mysql.checkContains({
            S3Files: [{ s3Key: 'aabbccdd_entry-name.png', uploadedDateUnix: 20 }]
        });
    });

    it('should make the entry listed once confirmed', async () => {
        await th.mysql.fixture(pendingFixture('aabbccdd_entry-name.png'));

        await request(app)
            .get('/clipboard/getPublicEntries')
            .expect(200)
            .then((response) => assert.lengthOf(response.body, 0));

        await request(app)
            .post('/clipboard/confirmUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send({ linkId: 'aabbccdd' })
            .expect(200);

        await request(app)
            .get('/clipboard/getPublicEntries')
            .expect(200)
            .then((response) => {
                assert.lengthOf(response.body, 1);
                assert.exists(response.body[0].s3PresignedUrl);
            });
    });
});
