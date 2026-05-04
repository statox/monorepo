import request from 'supertest';
import { app } from '../../src/app.js';
import { th } from '../helpers/index.js';

describe('authentication middlewares', () => {
    describe('auth none', () => {
        it('should not call authentication functions', async () => {
            await request(app).get('/getRoute').expect(200);
        });
    });
    describe('auth apikey for iot', () => {
        it('should reject missing Authorization header', async () => {
            await request(app).get('/apiiotAuthenticatedGetRoute').expect(401);
            th.slog.checkLog('auth', 'authIOT rejected', {
                error: {
                    httpStatus: 401,
                    code: 'MISSING_API_KEY'
                }
            });
        });

        it('should reject malformed Authorization header', async () => {
            await request(app)
                .get('/apiiotAuthenticatedGetRoute')
                .set('Authorization', 'InvalidScheme foobar')
                .expect(401);

            th.slog.checkLog('auth', 'authIOT rejected', {
                error: {
                    httpStatus: 401,
                    code: 'INVALID_AUTH_HEADER'
                }
            });
        });

        it('should reject unknown API key', async () => {
            await request(app)
                .get('/apiiotAuthenticatedGetRoute')
                .set('Authorization', 'Bearer unknownkey')
                .expect(403);

            th.slog.checkLog('auth', 'authIOT rejected', {
                error: {
                    httpStatus: 403,
                    code: 'UNKNOWN_API_KEY'
                }
            });
        });

        it('should accept valid api key', async () => {
            await request(app)
                .get('/apiiotAuthenticatedGetRoute')
                .set('Authorization', 'Bearer fakeaccesskeyfortests')
                .expect(200);
        });
    });
});
