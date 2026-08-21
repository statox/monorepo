import request from 'supertest';
import { app } from '../../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../../helpers/index.js';

describe('chords/deleteEntry', () => {
    it('should delete an existing chord entry', async () => {
        await th.mysql.fixture({
            Chord: [
                {
                    id: 1,
                    artist: 'artist',
                    title: 'title',
                    url: 'https://site.com/x',
                    tags: '[]',
                    creationDateUnix: 10,
                    visitsCount: 0,
                    lastAccessDateUnix: null
                },
                {
                    id: 2,
                    artist: 'other artist',
                    title: 'other title',
                    url: 'https://site.com/y',
                    tags: '[]',
                    creationDateUnix: 10,
                    visitsCount: 0,
                    lastAccessDateUnix: null
                }
            ]
        });

        await request(app)
            .post('/chords/deleteEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({ id: 1 })
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, {});
            });

        await th.mysql.checkTableLength('Chord', 1);
        await th.mysql.checkContains({ Chord: [{ id: 2 }] });

        th.slog.checkLog('app', 'access-log', {
            path: '/chords/deleteEntry',
            context: {
                id: 1
            }
        });
    });

    it('should not fail when deleting a non-existent id', async () => {
        await request(app)
            .post('/chords/deleteEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({ id: 999 })
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, {});
            });
    });
});
