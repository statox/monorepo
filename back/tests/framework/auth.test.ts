import assert from 'assert';
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
                    statusCode: 401,
                    status: 401,
                    code: 'unauthorized'
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
                    statusCode: 401,
                    status: 401,
                    code: 'unauthorized'
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
                    statusCode: 403,
                    status: 403,
                    code: 'forbidden'
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

    describe('google auth', () => {
        it('should return 401 when no Google session token is present', async () => {
            await request(app)
                .get('/googleauthenticatedgetroute')
                .expect(401)
                .then((response) => {
                    assert.equal(response.body.message, 'UNAUTHORIZED');
                });
        });

        it('should redirect to Google OAuth with youtube.readonly scope on auth start', async () => {
            const response = await request(app).get('/youtube/auth/start').expect(302);

            const location = response.headers['location'] as string;
            assert.ok(location, 'Expected a Location header');
            assert.ok(
                location.startsWith('https://accounts.google.com/o/oauth2/v2/auth'),
                `Expected redirect to Google auth URL, got: ${location}`
            );
            assert.ok(
                location.includes('youtube.readonly'),
                `Expected youtube.readonly scope in redirect URL, got: ${location}`
            );
            assert.ok(
                !location.includes('profile') &&
                    !location.includes('openid') &&
                    !location.includes('email'),
                `Expected NO profile/openid/email scope in redirect URL, got: ${location}`
            );
        });
    });
});
