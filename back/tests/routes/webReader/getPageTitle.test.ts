import request from 'supertest';
import { assert } from 'chai';
import { app } from '../../../src/app.js';
import { th } from '../../helpers/index.js';

describe('webReader/getPageTitle', () => {
    describe('should fail', () => {
        it('when unauthenticated', async () => {
            await request(app)
                .post('/webReader/getPageTitle')
                .set('Accept', 'application/json')
                .send({ url: 'https://example.com' })
                .expect(401);
        });

        it('when url field is missing', async () => {
            await request(app)
                .post('/webReader/getPageTitle')
                .set('Cookie', th.auth2.getPassportSessionCookie())
                .set('Accept', 'application/json')
                .send({})
                .expect(400)
                .then((response) => {
                    assert.match(
                        JSON.stringify(response.body),
                        new RegExp("must have required property 'url'")
                    );
                });
        });

        it('when url is not a valid URL', async () => {
            await request(app)
                .post('/webReader/getPageTitle')
                .set('Cookie', th.auth2.getPassportSessionCookie())
                .set('Accept', 'application/json')
                .send({ url: 'not-a-valid-url' })
                .expect(400)
                .then((response) => {
                    assert.deepEqual(response.body, { message: 'INVALID_URL' });
                });
        });
    });

    describe('should succeed', () => {
        it('returning the page title when the page has a title tag', async () => {
            th.fetch.respondWithHtml(
                '<html><head><title>My Cool Page</title></head><body></body></html>'
            );

            await request(app)
                .post('/webReader/getPageTitle')
                .set('Cookie', th.auth2.getPassportSessionCookie())
                .set('Accept', 'application/json')
                .send({ url: 'https://example.com' })
                .expect(200)
                .then((response) => {
                    assert.deepEqual(response.body, { title: 'My Cool Page' });
                });
        });

        it('returning an empty title when the page has no title tag', async () => {
            th.fetch.respondWithHtml('<html><body><p>No title here</p></body></html>');

            await request(app)
                .post('/webReader/getPageTitle')
                .set('Cookie', th.auth2.getPassportSessionCookie())
                .set('Accept', 'application/json')
                .send({ url: 'https://example.com' })
                .expect(200)
                .then((response) => {
                    assert.deepEqual(response.body, { title: '' });
                });
        });

        it('returning a 500 when the page cannot be fetched', async () => {
            th.fetch.respondWithNetworkError('Connection refused');

            await request(app)
                .post('/webReader/getPageTitle')
                .set('Cookie', th.auth2.getPassportSessionCookie())
                .set('Accept', 'application/json')
                .send({ url: 'https://example.com' })
                .expect(500);
        });
    });
});
