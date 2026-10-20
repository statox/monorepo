import {
    CreateBucketCommand,
    GetObjectCommand,
    ListBucketsCommand,
    PutBucketCorsCommand,
    PutObjectCommand,
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
    // By default the SDK adds a CRC32 of the body to presigned URLs. The body doesn't exist
    // at signing time so it signs the checksum of an empty body, which R2 rejects.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretKey
    }
});

export const getPresignedGetUrl = async (params: { bucket: string; key: string }) => {
    const cmd = new GetObjectCommand({ Bucket: params.bucket, Key: params.key });
    const url = await getSignedUrl(S3, cmd, { expiresIn: 3600 });
    return url;
};

export const getPresignedPutUrl = async (params: {
    bucket: string;
    key: string;
    contentType: string;
    contentLength: number;
}) => {
    const cmd = new PutObjectCommand({
        Bucket: params.bucket,
        Key: params.key,
        ContentType: params.contentType,
        ContentLength: params.contentLength
    });
    // Content-Type is not signed by default: without signableHeaders the URL accepts any
    // mime type. Content-Length is signed automatically once ContentLength is set.
    return getSignedUrl(S3, cmd, {
        expiresIn: 900,
        signableHeaders: new Set(['content-type'])
    });
};

// Browsers upload files straight to these buckets with presigned PUT URLs.
// In prod the equivalent rules are managed in terraform (cloudflare_r2_bucket_cors).
export const setLocalBucketsCors = async (buckets: string[]) => {
    for (const bucket of buckets) {
        try {
            console.log('S3 init - Set bucket CORS', bucket);
            await S3.send(
                new PutBucketCorsCommand({
                    Bucket: bucket,
                    CORSConfiguration: {
                        CORSRules: [
                            {
                                AllowedMethods: ['PUT'],
                                AllowedOrigins: ['https://localhost:8080'],
                                AllowedHeaders: ['content-type'],
                                ExposeHeaders: ['ETag'],
                                MaxAgeSeconds: 3600
                            }
                        ]
                    }
                })
            );
        } catch (error) {
            // Not fatal: only browser uploads to this local bucket are affected
            console.log('S3 init - Failed to set bucket CORS', bucket, error);
        }
    }
};

const requiredBuckets = ['clipboard', 'reactor'];
// Buckets receiving direct browser uploads through presigned PUT URLs
const directUploadBuckets = ['reactor'];

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

    await setLocalBucketsCors(directUploadBuckets);
};
