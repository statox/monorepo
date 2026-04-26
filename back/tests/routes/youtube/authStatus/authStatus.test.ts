import request from 'supertest';
import { app } from '../../../../src/app.js';
import { assert } from 'chai';

describe('youtube/authStatus', () => {
    it('should return authenticated: false when no Google session exists', async () => {
        await request(app)
            .get('/youtube/auth/status')
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, { authenticated: false });
            });
    });
});
