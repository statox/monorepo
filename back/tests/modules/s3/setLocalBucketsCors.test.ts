import { PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { assert } from 'chai';
import { s3Mock, setLocalBucketsCors } from '../../../src/libs/databases/s3.js';

describe('s3 - setLocalBucketsCors', () => {
    it('sets the browser upload CORS rule on every given bucket', async () => {
        await setLocalBucketsCors(['bucket-a', 'bucket-b']);

        const inputs = s3Mock.commandCalls(PutBucketCorsCommand).map((c) => c.args[0].input);
        assert.deepEqual(
            inputs.map((input) => input.Bucket),
            ['bucket-a', 'bucket-b']
        );
        const rule = inputs[0].CORSConfiguration?.CORSRules?.[0];
        assert.deepEqual(rule?.AllowedMethods, ['PUT']);
        assert.deepEqual(rule?.AllowedHeaders, ['content-type']);
    });

    it('does not throw and still processes the other buckets when the S3 server rejects one', async () => {
        s3Mock
            .on(PutBucketCorsCommand, { Bucket: 'bucket-a' })
            .rejects(new Error('NotImplemented'));

        // A failure here must not prevent the app from starting in local dev
        await setLocalBucketsCors(['bucket-a', 'bucket-b']);

        assert.lengthOf(s3Mock.commandCalls(PutBucketCorsCommand), 2);
    });
});
