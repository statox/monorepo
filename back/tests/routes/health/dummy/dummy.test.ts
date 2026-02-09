import request from 'supertest';
import { app } from '../../../../src/app.js';
import { assert } from 'chai';

/*
 * This is a dummy endpoint with a dummy env variable to test dotenvx.
 * TO BE REMOVED.
 */

describe('health/dummy', () => {
    // Use `curl http://localhost:3000/health/dummy` in dev
    it('should return the dummy variable with the test value', async () => {
        const response = await request(app).get('/health/dummy').expect(200);

        assert.equal(response.text, 'Dummy env variable: "dummy tests"');
    });
});
