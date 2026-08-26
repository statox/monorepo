import request from 'supertest';
import { app } from '../../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../../helpers/index.js';

describe('chords/getEntry', () => {
    it('should return the chord matching the given id', async () => {
        await th.mysql.fixture({
            Chord: [
                {
                    id: 1,
                    artist: 'artist',
                    title: 'title',
                    url: 'https://site.com/x',
                    tags: '["tag1"]',
                    contentB64: 'aGVsbG8=',
                    creationDateUnix: 10,
                    visitsCount: 2,
                    lastAccessDateUnix: 20
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
            .post('/chords/getEntry')
            .set('Accept', 'application/json')
            .send({ id: 1 })
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, {
                    id: 1,
                    artist: 'artist',
                    title: 'title',
                    url: 'https://site.com/x',
                    tags: ['tag1'],
                    contentB64: 'aGVsbG8=',
                    creationDateUnix: 10,
                    visitsCount: 2,
                    lastAccessDateUnix: 20
                });
            });
    });

    it('should return an ITEM_NOT_FOUND error for an unknown id', async () => {
        await th.mysql.fixture({ Chord: [] });

        await request(app)
            .post('/chords/getEntry')
            .set('Accept', 'application/json')
            .send({ id: 999 })
            .expect(400)
            .then((response) => {
                assert.deepEqual(response.body, {
                    httpStatus: 400,
                    code: 'ITEM_NOT_FOUND'
                });
            });
    });
});
