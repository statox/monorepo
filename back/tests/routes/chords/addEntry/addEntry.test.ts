import request from 'supertest';
import fs from 'node:fs/promises';
import { app } from '../../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../../helpers/index.js';

describe('chords/addEntry', () => {
    it('should create a new chord entry and skip extraction when no extractor matches the url', async () => {
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
                assert.deepEqual(response.body, {
                    status: 'SKIPPED',
                    label: 'a cool title (a cool artist)',
                    reason: 'no extractor for site.com'
                });
            });

        th.fetch.checkNotCalled();

        await th.mysql.checkContains({
            Chord: [
                {
                    artist: 'a cool artist',
                    title: 'a cool title',
                    url: 'https://site.com/url',
                    creationDateUnix: th.mysql.aroundNowSec,
                    visitsCount: 0,
                    lastAccessDateUnix: null,
                    contentB64: null,
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

    it('should extract and save the chord content when the url is supported and reachable', async () => {
        const url = 'https://www.boiteachansons.net/en/partitions/hugues-aufray/santiano';
        const html = await fs.readFile(
            'tests/modules/chords/fixtures/boiteachansons-santiano.html',
            'utf8'
        );
        th.fetch.respondWithHtmlForUrl(url, html);

        await request(app)
            .post('/chords/addEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                artist: 'Hugues Aufray',
                title: 'Santiano',
                url,
                tags: []
            })
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
                    artist: 'Hugues Aufray',
                    title: 'Santiano',
                    url,
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

        await request(app)
            .post('/chords/addEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                artist: 'Hugues Aufray',
                title: 'Santiano',
                url,
                tags: []
            })
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, {
                    status: 'FAILED',
                    label: 'Santiano (Hugues Aufray)',
                    reason: 'fetch failed: Connection refused'
                });
            });

        th.fetch.checkCalledWithUrl(url);

        await th.mysql.checkContains({
            Chord: [
                {
                    artist: 'Hugues Aufray',
                    title: 'Santiano',
                    url,
                    contentB64: null
                }
            ]
        });
    });

    it('should mark extraction as failed when the page cannot be parsed', async () => {
        const url = 'https://www.boiteachansons.net/en/partitions/hugues-aufray/santiano';
        th.fetch.respondWithHtmlForUrl(url, '<html><body>no chords here</body></html>');

        await request(app)
            .post('/chords/addEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                artist: 'Hugues Aufray',
                title: 'Santiano',
                url,
                tags: []
            })
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, {
                    status: 'FAILED',
                    label: 'Santiano (Hugues Aufray)',
                    reason: 'boiteachansons extractor could not parse this page'
                });
            });

        th.fetch.checkCalledWithUrl(url);

        await th.mysql.checkContains({
            Chord: [
                {
                    artist: 'Hugues Aufray',
                    title: 'Santiano',
                    url,
                    contentB64: null
                }
            ]
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
