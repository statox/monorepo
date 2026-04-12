import request from 'supertest';
import { app } from '../../../src/app.js';
import { th } from '../../helpers/index.js';

const validPayload = {
    clientTimestamp: 1700000000,
    app: 'my-app',
    path: '/some/path',
    action: 'click',
    clientId: 'abc-123'
};

describe('webStats/record', () => {
    it('should record the event and return 200', async () => {
        await request(app)
            .post('/web-stats/record')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer fakeaccesskeyfortests')
            .send(validPayload)
            .expect(200);

        await th.mysql.checkContains({
            WebStats: [
                {
                    clientTimestampUnix: 1700000000,
                    app: 'my-app',
                    path: '/some/path',
                    action: 'click',
                    clientId: 'abc-123',
                    createdAtUnix: th.mysql.aroundNowSec
                }
            ]
        });

        th.slog.checkLog('web-stats', 'Event recorded', {
            app: 'my-app',
            path: '/some/path',
            action: 'click'
        });
    });

    it('should return 401 when no API key is provided', async () => {
        await request(app)
            .post('/web-stats/record')
            .set('Accept', 'application/json')
            .send(validPayload)
            .expect(401);

        await th.mysql.checkTableLength('WebStats', 0);
    });

    it('should return 403 when an invalid API key is provided', async () => {
        await request(app)
            .post('/web-stats/record')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer wrongapikey')
            .send(validPayload)
            .expect(403);

        await th.mysql.checkTableLength('WebStats', 0);
    });

    it('should return 400 when a required field is missing', async () => {
        await request(app)
            .post('/web-stats/record')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer fakeaccesskeyfortests')
            .send({ app: 'my-app', path: '/some/path', action: 'click' })
            .expect(400);

        await th.mysql.checkTableLength('WebStats', 0);
    });

    it('should return 400 when a field has the wrong type', async () => {
        await request(app)
            .post('/web-stats/record')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer fakeaccesskeyfortests')
            .send({ ...validPayload, clientTimestamp: 'not-a-number' })
            .expect(400);

        await th.mysql.checkTableLength('WebStats', 0);
    });
});
