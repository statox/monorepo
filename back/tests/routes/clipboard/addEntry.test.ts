import request from 'supertest';
import { app } from '../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../helpers/index.js';

describe('clipboard/addEntry', () => {
    describe('should reject', () => {
        it('when unauthenticated', async () => {
            await request(app)
                .post('/clipboard/addEntry')
                .send({ name: 'A cool entry', content: 'foo' })
                .expect(401);
            await th.mysql.checkTableLength('Clipboard', 0);
        });

        const invalidInputs: [string, Record<string, unknown>][] = [
            ['a query with no content', { name: 'A cool entry' }],
            ['a query with empty content', { name: 'A cool entry', content: '' }],
            ['a query with empty name', { name: '', content: 'foo' }],
            ['a negative ttl', { name: 'A cool entry', content: 'foo', ttlSeconds: -1 }],
            ['a ttl sent as a string', { name: 'A cool entry', content: 'foo', ttlSeconds: '60' }]
        ];
        for (const [label, input] of invalidInputs) {
            it(label, async () => {
                await request(app)
                    .post('/clipboard/addEntry')
                    .set('Cookie', th.auth2.getPassportSessionCookie())
                    .set('Accept', 'application/json')
                    .send(input)
                    .expect(400)
                    .then((response) => {
                        assert.equal(response.body.code, 'INPUT_VALIDATION_FAILED');
                    });

                await th.mysql.checkTableLength('Clipboard', 0);
            });
        }

        it('a duplicate entry', async () => {
            await th.mysql.fixture({
                Clipboard: [
                    {
                        id: 1,
                        name: 'A cool entry',
                        content: 'Look at that content',
                        creationDateUnix: 10,
                        ttl: 100,
                        linkId: 'aabbccdd'
                    }
                ]
            });

            await request(app)
                .post('/clipboard/addEntry')
                .set('Cookie', th.auth2.getPassportSessionCookie())
                .set('Accept', 'application/json')
                .send({
                    name: 'A cool entry',
                    content: 'Foo'
                })
                .expect(400)
                .then((response) => {
                    assert.deepEqual(response.body, {
                        httpStatus: 400,
                        code: 'ITEM_ALREADY_EXISTS'
                    });
                });

            await th.mysql.checkContains({
                Clipboard: [
                    {
                        name: 'A cool entry',
                        content: 'Look at that content',
                        creationDateUnix: 10
                    }
                ]
            });
            await th.mysql.checkTableLength('Clipboard', 1);
        });
    });

    describe('should successfully create a new entry', () => {
        it('private entry - default ttl is set to 5 minutes', async () => {
            await request(app)
                .post('/clipboard/addEntry')
                .set('Cookie', th.auth2.getPassportSessionCookie())
                .set('Accept', 'application/json')
                .send({
                    name: 'A cool entry',
                    content: 'Look at that content'
                })
                .expect(200);

            await th.mysql.checkContains({
                Clipboard: [
                    {
                        name: 'A cool entry',
                        content: 'Look at that content',
                        ttl: 60 * 5,
                        isPublic: 0,
                        s3Key: null,
                        creationDateUnix: th.mysql.aroundNowSec
                    }
                ]
            });

            th.s3.checkNbCalls({ nbCalls: 0 });
            await th.mysql.checkTableLength('S3Files', 0);
        });

        it('public entry - with custom ttl', async () => {
            await request(app)
                .post('/clipboard/addEntry')
                .set('Cookie', th.auth2.getPassportSessionCookie())
                .set('Accept', 'application/json')
                .send({
                    name: 'A cool entry',
                    content: 'Look at that content',
                    ttlSeconds: 60,
                    isPublic: true
                })
                .expect(200);

            await th.mysql.checkContains({
                Clipboard: [
                    {
                        name: 'A cool entry',
                        content: 'Look at that content',
                        ttl: 60,
                        isPublic: 1,
                        s3Key: null,
                        creationDateUnix: th.mysql.aroundNowSec
                    }
                ]
            });

            th.s3.checkNbCalls({ nbCalls: 0 });
            await th.mysql.checkTableLength('S3Files', 0);
        });
    });
});
