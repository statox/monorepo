import request from 'supertest';
import { app } from '../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../helpers/index.js';

const pendingFixture = (s3Key: string, uploadedDateUnix: number | null = null) => ({
    Reactor: [
        {
            id: 1,
            name: 'entry name',
            tags: '[]',
            creationDateUnix: 10,
            linkId: 'aabbccdd',
            s3Key
        }
    ],
    S3Files: [{ bucket: 'reactor', s3Key, creationDateUnix: 10, uploadedDateUnix }]
});

describe('reactor/confirmUpload', () => {
    describe('should fail', () => {
        it('when unauthenticated', async () => {
            await request(app)
                .post('/reactor/confirmUpload')
                .send({ linkId: 'aabbccdd' })
                .expect(401);
        });

        it('on unknown linkId', async () => {
            await th.mysql.fixture({ Reactor: [] });

            await request(app)
                .post('/reactor/confirmUpload')
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
                .post('/reactor/confirmUpload')
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
            .post('/reactor/confirmUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send({ linkId: 'aabbccdd' })
            .expect(200);

        th.s3.checkNbCalls({ nbCalls: 1 });
        th.s3.checkCall({
            commandType: 'HeadObject',
            input: { Bucket: 'reactor', Key: 'aabbccdd_entry-name.png' }
        });

        await th.mysql.checkContains({
            S3Files: [{ s3Key: 'aabbccdd_entry-name.png', uploadedDateUnix: th.mysql.aroundNowSec }]
        });
    });

    it('should be idempotent on an already confirmed file', async () => {
        await th.mysql.fixture(pendingFixture('aabbccdd_entry-name.png', 20));

        await request(app)
            .post('/reactor/confirmUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send({ linkId: 'aabbccdd' })
            .expect(200);

        await th.mysql.checkContains({
            S3Files: [{ s3Key: 'aabbccdd_entry-name.png', uploadedDateUnix: 20 }]
        });
    });

    it('should make the entry readable once confirmed', async () => {
        await th.mysql.fixture(pendingFixture('aabbccdd_entry-name.png'));

        await request(app).get('/r/aabbccdd').expect(400);

        await request(app)
            .post('/reactor/confirmUpload')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .send({ linkId: 'aabbccdd' })
            .expect(200);

        await request(app).get('/r/aabbccdd').expect(302);
    });
});
