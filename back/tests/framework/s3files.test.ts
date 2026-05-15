import { assert } from 'chai';
import { createS3Key } from '../../src/libs/modules/s3files/index.js';

describe('s3files/createS3Key', () => {
    it('returns a linkId and an s3Key', () => {
        const { linkId, s3Key } = createS3Key({ filename: 'hello world' });
        assert.isString(linkId);
        assert.isString(s3Key);
    });

    it('slugifies spaces in the filename', () => {
        const { s3Key } = createS3Key({ filename: 'entry name' });
        assert.match(s3Key, /^[0-9a-f]{8}_entry-name$/);
    });

    it('slugifies path separators', () => {
        const { s3Key } = createS3Key({ filename: 'foo/bar' });
        assert.match(s3Key, /^[0-9a-f]{8}_foobar$/);
    });

    it('slugifies underscores', () => {
        const { s3Key } = createS3Key({ filename: 'with_underscore' });
        assert.match(s3Key, /^[0-9a-f]{8}_withunderscore$/);
    });

    it('appends extension when provided', () => {
        const { s3Key } = createS3Key({ filename: 'image', extension: 'png' });
        assert.match(s3Key, /^[0-9a-f]{8}_image\.png$/);
    });

    it('omits extension when not provided', () => {
        const { s3Key } = createS3Key({ filename: 'image' });
        assert.notMatch(s3Key, /\./);
    });

    it('generates unique linkId on each call', () => {
        const a = createS3Key({ filename: 'test' });
        const b = createS3Key({ filename: 'test' });
        assert.notEqual(a.linkId, b.linkId);
    });
});
