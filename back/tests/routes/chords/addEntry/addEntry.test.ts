import request from 'supertest';
import { app } from '../../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../../helpers/index.js';

describe('chords/addEntry', () => {
    it('should create a new chord entry', async () => {
        await request(app)
            .post('/chords/addEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                artist: 'a cool artist',
                title: 'a cool title',
                url: 'https://site.com/url',
                tags: ['slow', 'chill']
            })
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, {});
            });

        await th.mysql.checkContains({
            Chord: [
                {
                    artist: 'a cool artist',
                    title: 'a cool title',
                    url: 'https://site.com/url',
                    creationDateUnix: th.mysql.aroundNowSec,
                    visitsCount: 0,
                    lastAccessDateUnix: null,
                    tags: (value: string) => {
                        assert.deepEqual(JSON.parse(value), ['slow', 'chill']);
                        return true;
                    }
                }
            ]
        });

        th.slog.checkLog('app', 'access-log', {
            path: '/chords/addEntry',
            context: {
                chords_newChordUrl: 'https://site.com/url'
            }
        });
    });

    it('should reject a duplicate url', async () => {
        await th.mysql.fixture({
            Chord: [
                {
                    id: 1,
                    artist: 'existing artist',
                    title: 'existing title',
                    url: 'https://site.com/url',
                    tags: '[]',
                    creationDateUnix: 10,
                    visitsCount: 0,
                    lastAccessDateUnix: null
                }
            ]
        });

        await request(app)
            .post('/chords/addEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                artist: 'another artist',
                title: 'another title',
                url: 'https://site.com/url',
                tags: []
            })
            .expect(400)
            .then((response) => {
                assert.deepEqual(response.body, { httpStatus: 400, code: 'ITEM_ALREADY_EXISTS' });
            });

        await th.mysql.checkTableLength('Chord', 1);
    });

    it('rejects an empty artist', async () => {
        await request(app)
            .post('/chords/addEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                artist: '',
                title: 'a cool title',
                url: 'https://site.com/url',
                tags: []
            })
            .expect(400);

        await th.mysql.checkTableLength('Chord', 0);
    });
});
