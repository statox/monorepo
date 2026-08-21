import request from 'supertest';
import { app } from '../../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../../helpers/index.js';

describe('chords/addLinkVisit', () => {
    it('should increment visitsCount on an existing chord', async () => {
        await th.mysql.fixture({
            Chord: [
                {
                    id: 1,
                    artist: 'artist',
                    title: 'title',
                    url: 'https://bar.com',
                    tags: '[]',
                    creationDateUnix: 1,
                    visitsCount: 2,
                    lastAccessDateUnix: 1
                },
                {
                    id: 2,
                    artist: 'other artist',
                    title: 'other title',
                    url: 'https://foo.com',
                    tags: '[]',
                    creationDateUnix: 1,
                    visitsCount: 1,
                    lastAccessDateUnix: 1
                }
            ]
        });

        await request(app)
            .post('/chords/addLinkVisit')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                id: 1
            })
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, {});
            });

        await th.mysql.checkContains({
            Chord: [
                {
                    id: 1,
                    visitsCount: 3,
                    lastAccessDateUnix: th.mysql.aroundNowSec
                },
                {
                    id: 2,
                    visitsCount: 1,
                    lastAccessDateUnix: 1
                }
            ]
        });

        th.slog.checkLog('app', 'access-log', {
            path: '/chords/addLinkVisit',
            context: {
                id: 1
            }
        });
    });

    it('should reject an id with no matching chord', async () => {
        await th.mysql.fixture({
            Chord: [
                {
                    id: 1,
                    artist: 'artist',
                    title: 'title',
                    url: 'https://foo.com',
                    tags: '[]',
                    creationDateUnix: 1,
                    visitsCount: 1,
                    lastAccessDateUnix: 1
                }
            ]
        });

        await request(app)
            .post('/chords/addLinkVisit')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                id: 999
            })
            .expect(400)
            .then((response) => {
                assert.deepEqual(response.body, { httpStatus: 400, code: 'ITEM_NOT_FOUND' });
            });

        await th.mysql.checkContains({
            Chord: [
                {
                    id: 1,
                    visitsCount: 1,
                    lastAccessDateUnix: 1
                }
            ]
        });
    });
});
