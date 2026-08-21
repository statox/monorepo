import request from 'supertest';
import { app } from '../../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../../helpers/index.js';

describe('chords/updateEntry', () => {
    it('should update an existing chord entry', async () => {
        await th.mysql.fixture({
            Chord: [
                {
                    id: 1,
                    artist: 'old artist',
                    title: 'old title',
                    url: 'https://site.com/old',
                    tags: '["old"]',
                    creationDateUnix: 10,
                    visitsCount: 3,
                    lastAccessDateUnix: 10
                }
            ]
        });

        await request(app)
            .post('/chords/updateEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                id: 1,
                artist: 'new artist',
                title: 'new title',
                url: 'https://site.com/new',
                tags: ['new', 'tags']
            })
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, {});
            });

        await th.mysql.checkContains({
            Chord: [
                {
                    id: 1,
                    artist: 'new artist',
                    title: 'new title',
                    url: 'https://site.com/new',
                    visitsCount: 3,
                    lastAccessDateUnix: 10,
                    tags: (value: string) => {
                        assert.deepEqual(JSON.parse(value), ['new', 'tags']);
                        return true;
                    }
                }
            ]
        });

        th.slog.checkLog('app', 'access-log', {
            path: '/chords/updateEntry',
            context: {
                id: 1,
                chords_updatedChordUrl: 'https://site.com/new'
            }
        });
    });

    it('should accept resubmitting identical values (no-op update)', async () => {
        await th.mysql.fixture({
            Chord: [
                {
                    id: 1,
                    artist: 'same artist',
                    title: 'same title',
                    url: 'https://site.com/same',
                    tags: '["same"]',
                    creationDateUnix: 10,
                    visitsCount: 3,
                    lastAccessDateUnix: 10
                }
            ]
        });

        await request(app)
            .post('/chords/updateEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                id: 1,
                artist: 'same artist',
                title: 'same title',
                url: 'https://site.com/same',
                tags: ['same']
            })
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, {});
            });

        await th.mysql.checkContains({
            Chord: [
                {
                    id: 1,
                    artist: 'same artist',
                    title: 'same title',
                    url: 'https://site.com/same',
                    tags: (value: string) => {
                        assert.deepEqual(JSON.parse(value), ['same']);
                        return true;
                    }
                }
            ]
        });
    });

    it('should reject updating to a url used by another chord', async () => {
        await th.mysql.fixture({
            Chord: [
                {
                    id: 1,
                    artist: 'artist one',
                    title: 'title one',
                    url: 'https://site.com/one',
                    tags: '[]',
                    creationDateUnix: 10,
                    visitsCount: 0,
                    lastAccessDateUnix: null
                },
                {
                    id: 2,
                    artist: 'artist two',
                    title: 'title two',
                    url: 'https://site.com/two',
                    tags: '[]',
                    creationDateUnix: 10,
                    visitsCount: 0,
                    lastAccessDateUnix: null
                }
            ]
        });

        await request(app)
            .post('/chords/updateEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                id: 2,
                artist: 'artist two',
                title: 'title two',
                url: 'https://site.com/one',
                tags: []
            })
            .expect(400)
            .then((response) => {
                assert.deepEqual(response.body, { httpStatus: 400, code: 'ITEM_ALREADY_EXISTS' });
            });

        await th.mysql.checkContains({
            Chord: [{ id: 2, url: 'https://site.com/two' }]
        });
    });

    it('should reject an id with no matching chord', async () => {
        await request(app)
            .post('/chords/updateEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                id: 999,
                artist: 'artist',
                title: 'title',
                url: 'https://site.com/x',
                tags: []
            })
            .expect(400)
            .then((response) => {
                assert.deepEqual(response.body, { httpStatus: 400, code: 'ITEM_NOT_FOUND' });
            });
    });

    it('rejects an empty artist', async () => {
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
                }
            ]
        });

        await request(app)
            .post('/chords/updateEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                id: 1,
                artist: '',
                title: 'title',
                url: 'https://site.com/x',
                tags: []
            })
            .expect(400);

        await th.mysql.checkContains({ Chord: [{ id: 1, artist: 'artist' }] });
    });
});
