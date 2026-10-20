import request from 'supertest';
import { app } from '../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../helpers/index.js';

describe('reactor/getEntriesForPublic', () => {
    it('should retrieve all entries and format the tags and s3key properly', async () => {
        const entry1 = {
            id: 1,
            name: 'entry 1',
            tags: '["tag1","tag2"]',
            creationDateUnix: 10,
            linkId: 'aaaaaaaa',
            s3Key: 'foo'
        };
        const entry2 = {
            id: 2,
            name: 'entry 2',
            tags: '[]',
            creationDateUnix: 50,
            linkId: 'bbbbbbbb',
            s3Key: 'bar'
        };
        await th.mysql.fixture({
            Reactor: [entry1, entry2],
            S3Files: [
                {
                    bucket: 'reactor',
                    s3Key: 'foo',
                    creationDateUnix: 10,
                    uploadedDateUnix: 10
                },
                {
                    bucket: 'reactor',
                    s3Key: 'bar',
                    creationDateUnix: 50,
                    uploadedDateUnix: 50
                }
            ]
        });

        await request(app)
            .get('/reactor/getEntriesForPublic')
            .set('Accept', 'application/json')
            .expect(200)
            .then((response) => {
                assert.lengthOf(response.body, 2);
                const r1 = response.body[0];
                assert.propertyVal(r1, 'name', 'entry 1');
                assert.propertyVal(r1, 'creationDateUnix', 10);
                assert.deepEqual(r1.tags, ['tag1', 'tag2']);
                try {
                    new URL(r1.s3PresignedUrl);
                } catch {
                    assert.fail('entry 1 s3PresignedUrl is not an url');
                }

                const r2 = response.body[1];
                assert.propertyVal(r2, 'name', 'entry 2');
                assert.propertyVal(r2, 'creationDateUnix', 50);
                assert.deepEqual(r2.tags, []);
                try {
                    new URL(r2.s3PresignedUrl);
                } catch {
                    assert.fail('entry 2 s3PresignedUrl is not an url');
                }
            });
    });

    it('should ignore entries whose S3File was deleted but log the issue', async () => {
        await th.mysql.fixture({
            Reactor: [
                {
                    id: 1,
                    name: 'entry 1',
                    tags: '["tag1","tag2"]',
                    creationDateUnix: 10,
                    linkId: 'aaaaaaaa',
                    s3Key: 'foo'
                },
                {
                    id: 2,
                    name: 'entry 2',
                    tags: '[]',
                    creationDateUnix: 50,
                    linkId: 'bbbbbbbb',
                    s3Key: 'bar'
                }
            ],
            S3Files: [
                { bucket: 'reactor', s3Key: 'foo', creationDateUnix: 10, uploadedDateUnix: 10 },
                {
                    bucket: 'reactor',
                    s3Key: 'bar',
                    creationDateUnix: 50,
                    uploadedDateUnix: 50,
                    deletionDateUnix: 60
                }
            ]
        });

        await request(app)
            .get('/reactor/getEntriesForPublic')
            .set('Accept', 'application/json')
            .expect(200)
            .then((response) => {
                assert.lengthOf(response.body, 1);
                assert.propertyVal(response.body[0], 'name', 'entry 1');
            });

        th.slog.checkLog('reactor', 'error while enriching entry', {
            entryName: 'entry 2'
        });
    });

    it('should silently skip entries pending upload or without S3File', async () => {
        await th.mysql.fixture({
            Reactor: [
                {
                    id: 1,
                    name: 'uploaded',
                    tags: '[]',
                    creationDateUnix: 10,
                    linkId: 'aaaaaaaa',
                    s3Key: 'foo'
                },
                {
                    id: 2,
                    name: 'pending',
                    tags: '[]',
                    creationDateUnix: 20,
                    linkId: 'bbbbbbbb',
                    s3Key: 'bar'
                },
                {
                    id: 3,
                    name: 'no file',
                    tags: '[]',
                    creationDateUnix: 30,
                    linkId: 'cccccccc',
                    s3Key: 'baz'
                }
            ],
            S3Files: [
                { bucket: 'reactor', s3Key: 'foo', creationDateUnix: 10, uploadedDateUnix: 10 },
                { bucket: 'reactor', s3Key: 'bar', creationDateUnix: 20, uploadedDateUnix: null }
            ]
        });

        await request(app)
            .get('/reactor/getEntriesForPublic')
            .set('Accept', 'application/json')
            .expect(200)
            .then((response) => {
                assert.deepEqual(
                    response.body.map((e: { name: string }) => e.name),
                    ['uploaded']
                );
            });

        th.slog.checkNoLog('reactor', 'error while enriching entry');
    });
});
