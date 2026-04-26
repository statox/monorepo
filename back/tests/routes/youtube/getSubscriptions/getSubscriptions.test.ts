import request from 'supertest';
import { app } from '../../../../src/app.js';
import { assert } from 'chai';

describe('youtube/getSubscriptions', () => {
    it('should return 401 when not authenticated with Google', async () => {
        await request(app)
            .get('/youtube/subscriptions')
            .expect(401)
            .then((response) => {
                assert.equal(response.body.message, 'UNAUTHORIZED');
            });
    });
});
