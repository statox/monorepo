import {
    DeleteObjectCommand,
    DeleteObjectCommandInput,
    GetObjectCommand,
    HeadObjectCommand,
    HeadObjectCommandInput,
    PutObjectCommand,
    PutObjectCommandInput
} from '@aws-sdk/client-s3';
import { assert } from 'chai';
import { s3Mock } from '../../../src/libs/databases/s3.js';
import { TestHelper } from '../TestHelper.js';

const commandsByType = {
    DeleteObject: DeleteObjectCommand,
    GetObject: GetObjectCommand,
    HeadObject: HeadObjectCommand,
    PutObject: PutObjectCommand
};

class TestHelper_S3 extends TestHelper {
    constructor() {
        super({
            name: 'S3',
            hooks: {
                beforeEach: () => {
                    s3Mock.reset();

                    // TODO See if we want to have a finer way to fail calls to S3
                    // For now any call with a key containing shouldfail will fail
                    s3Mock.on(PutObjectCommand).callsFake((input: PutObjectCommandInput) => {
                        if (input.Key?.includes('shouldfail')) {
                            throw new Error('Simulated failure');
                        }
                        return {};
                    });

                    s3Mock.on(DeleteObjectCommand).callsFake((input: DeleteObjectCommandInput) => {
                        if (input.Key?.includes('shouldfail')) {
                            throw new Error('Simulated failure');
                        }
                        return {};
                    });

                    // HeadObject on a key containing notuploaded behaves like a missing object
                    s3Mock.on(HeadObjectCommand).callsFake((input: HeadObjectCommandInput) => {
                        if (input.Key?.includes('notuploaded')) {
                            throw Object.assign(new Error('NotFound'), {
                                name: 'NotFound',
                                $metadata: { httpStatusCode: 404 }
                            });
                        }
                        return {};
                    });
                }
            }
        });
    }

    checkNbCalls = (params: { nbCalls: number }) => {
        assert.equal(s3Mock.calls().length, params.nbCalls);
    };

    checkCall = (params: {
        commandType: keyof typeof commandsByType;
        input: { [key: string]: string };
    }) => {
        assert.isNotEmpty(s3Mock.commandCalls(commandsByType[params.commandType]));

        if (params.input) {
            const c = s3Mock.calls().pop();
            if (!c) {
                return assert.fail();
            }

            // c.args[0] is the Command instance; .input holds the SDK call parameters
            const actualInput =
                (c.args[0] as unknown as { input?: Record<string, unknown> })?.input ?? {};

            for (const key of Object.keys(params.input)) {
                const expectedValue = params.input[key];
                const actualValue = actualInput[key];
                assert.equal(
                    actualValue,
                    expectedValue,
                    `S3 input mismatch for "${key}"\n  expected: ${JSON.stringify(expectedValue)}\n  actual:   ${JSON.stringify(actualValue)}\n  full input: ${JSON.stringify(actualInput, null, 2)}`
                );
            }
        }
    };
}
export const testHelper_S3 = new TestHelper_S3();
