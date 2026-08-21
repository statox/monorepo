import {
    CreateBucketCommand,
    GetObjectCommand,
    ListBucketsCommand,
    S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../../packages/config/index.js';
import { AwsClientStub, mockClient } from 'aws-sdk-client-mock';

const { isProd, isTests } = config.env;

export let s3Mock: AwsClientStub<S3Client>;
if (isTests) {
    console.log('mocking s3');
    s3Mock = mockClient(S3Client);
}

export const S3 = new S3Client({
    region: isProd ? 'auto' : 'eu-west-1',
    endpoint: config.r2.endpoint,
    // RustFS (used for local dev) only supports path-style bucket addressing
    forcePathStyle: !isProd,
    credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretKey
    }
});

export const getPresignedUrl = async (params: { bucket: string; key: string }) => {
    const cmd = new GetObjectCommand({ Bucket: params.bucket, Key: params.key });
    const url = await getSignedUrl(S3, cmd, { expiresIn: 3600 });
    return url;
};

const requiredBuckets = ['clipboard', 'reactor'];

export const initS3 = async () => {
    if (isProd) {
        console.log('dont init local s3 we are in prod');
        return;
    }
    if (isTests) {
        console.log('dont init local s3 we are in tests');
        return;
    }

    console.log('S3 init - Check buckets to create');
    const listResponse = await S3.send(new ListBucketsCommand({}));
    const existingBuckets = listResponse.Buckets || [];

    const bucketsNotCreated = requiredBuckets.filter(
        (required) => !existingBuckets.map((b) => b.Name).includes(required)
    );

    for (const bucket of bucketsNotCreated) {
        console.log('S3 init - Create bucket', bucket);
        await S3.send(new CreateBucketCommand({ Bucket: bucket }));
    }
};
