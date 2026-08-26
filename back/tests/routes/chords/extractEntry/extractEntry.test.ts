import request from 'supertest';
import fs from 'node:fs/promises';
import { app } from '../../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../../helpers/index.js';

describe('chords/extractEntry', () => {
    it('should extract and save the chord content when the url is supported and reachable', async () => {
        const url = 'https://www.boiteachansons.net/en/partitions/hugues-aufray/santiano';
        const html = await fs.readFile(
            'tests/modules/chords/fixtures/boiteachansons-santiano.html',
            'utf8'
        );
        th.fetch.respondWithHtmlForUrl(url, html);

        await th.mysql.fixture({
            Chord: [
                {
                    id: 1,
                    artist: 'Hugues Aufray',
                    title: 'Santiano',
                    url,
                    tags: '[]',
                    contentB64: null,
                    creationDateUnix: 10,
                    visitsCount: 0,
                    lastAccessDateUnix: null
                }
            ]
        });

        await request(app)
            .post('/chords/extractEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({ id: 1 })
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, {
                    status: 'OK',
                    label: 'Santiano (Hugues Aufray)',
                    reason: 'saved to db'
                });
            });

        th.fetch.checkCalledWithUrl(url);

        await th.mysql.checkContains({
            Chord: [
                {
                    id: 1,
                    contentB64: (value: string) => {
                        assert.isNotNull(value);
                        const text = Buffer.from(value, 'base64').toString('utf8');
                        assert.include(text, "C'est");
                        return true;
                    }
                }
            ]
        });
    });

    it('should mark extraction as failed when the url cannot be fetched', async () => {
        const url = 'https://www.boiteachansons.net/en/partitions/hugues-aufray/santiano';
        th.fetch.respondWithNetworkErrorForUrl(url, 'Connection refused');

        await th.mysql.fixture({
            Chord: [
                {
                    id: 1,
                    artist: 'Hugues Aufray',
                    title: 'Santiano',
                    url,
                    tags: '[]',
                    contentB64: null,
                    creationDateUnix: 10,
                    visitsCount: 0,
                    lastAccessDateUnix: null
                }
            ]
        });

        await request(app)
            .post('/chords/extractEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({ id: 1 })
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, {
                    status: 'FAILED',
                    label: 'Santiano (Hugues Aufray)',
                    reason: 'fetch failed: Connection refused'
                });
            });

        await th.mysql.checkContains({ Chord: [{ id: 1, contentB64: null }] });
    });

    it('should skip extraction when no extractor matches the url', async () => {
        await th.mysql.fixture({
            Chord: [
                {
                    id: 1,
                    artist: 'a cool artist',
                    title: 'a cool title',
                    url: 'https://site.com/url',
                    tags: '[]',
                    contentB64: null,
                    creationDateUnix: 10,
                    visitsCount: 0,
                    lastAccessDateUnix: null
                }
            ]
        });

        await request(app)
            .post('/chords/extractEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({ id: 1 })
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, {
                    status: 'SKIPPED',
                    label: 'a cool title (a cool artist)',
                    reason: 'no extractor for site.com'
                });
            });

        th.fetch.checkNotCalled();
    });

    it('should skip extraction and not fetch the url when the chord already has extracted content', async () => {
        const url = 'https://www.boiteachansons.net/en/partitions/hugues-aufray/santiano';

        await th.mysql.fixture({
            Chord: [
                {
                    id: 1,
                    artist: 'Hugues Aufray',
                    title: 'Santiano',
                    url,
                    tags: '[]',
                    contentB64: 'aGVsbG8=',
                    creationDateUnix: 10,
                    visitsCount: 0,
                    lastAccessDateUnix: null
                }
            ]
        });

        await request(app)
            .post('/chords/extractEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({ id: 1 })
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, {
                    status: 'SKIPPED',
                    label: 'Santiano (Hugues Aufray)',
                    reason: 'chord already has extracted content, skipping to avoid overriding it'
                });
            });

        th.fetch.checkNotCalled();

        await th.mysql.checkContains({ Chord: [{ id: 1, contentB64: 'aGVsbG8=' }] });
    });

    it('should return an ITEM_NOT_FOUND error for an unknown id', async () => {
        await th.mysql.fixture({ Chord: [] });

        await request(app)
            .post('/chords/extractEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
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
