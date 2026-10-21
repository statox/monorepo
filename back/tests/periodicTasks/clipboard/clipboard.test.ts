import { cleanupAbandonedUploads } from '../../../src/libs/modules/clipboard/index.js';
import { th } from '../../helpers/index.js';

const now = () => Math.round(Date.now() / 1000);

const entry = (
    id: number,
    s3Key: string | null,
    createdAgoSec: number,
    uploadedDateUnix: number | null
) => ({
    clipboard: {
        id,
        name: `entry ${id}`,
        content: '',
        ttl: 100,
        creationDateUnix: now() - createdAgoSec,
        linkId: `0000000${id}`,
        s3Key
    },
    s3File: s3Key
        ? { bucket: 'clipboard', s3Key, creationDateUnix: now() - createdAgoSec, uploadedDateUnix }
        : undefined
});

const fixture = async (entries: ReturnType<typeof entry>[]) => {
    await th.mysql.fixture({
        Clipboard: entries.map((e) => e.clipboard),
        S3Files: entries.flatMap((e) => (e.s3File ? [e.s3File] : []))
    });
};

describe('periodic task - clipboard cleanupAbandonedUploads', () => {
    it('deletes a pending upload older than one hour', async () => {
        await fixture([entry(1, 'stale.png', 2 * 3600, null)]);

        await cleanupAbandonedUploads();

        th.s3.checkNbCalls({ nbCalls: 1 });
        th.s3.checkCall({
            commandType: 'DeleteObject',
            input: { Bucket: 'clipboard', Key: 'stale.png' }
        });
        await th.mysql.checkTableLength('Clipboard', 0);
        await th.mysql.checkTableLength('S3Files', 0);
        th.slog.checkLog('clipboard', 'Deleted abandoned upload', {
            entryName: 'entry 1',
            s3Key: 'stale.png'
        });
        th.push.checkNoNotifications();
    });

    it('keeps a pending upload younger than one hour', async () => {
        await fixture([entry(1, 'fresh.png', 10 * 60, null)]);

        await cleanupAbandonedUploads();

        th.s3.checkNbCalls({ nbCalls: 0 });
        await th.mysql.checkTableLength('Clipboard', 1);
        await th.mysql.checkTableLength('S3Files', 1);
    });

    it('keeps an old confirmed upload and an old text entry', async () => {
        await fixture([
            entry(1, 'confirmed.png', 2 * 3600, now() - 2 * 3600 + 30),
            entry(2, null, 2 * 3600, null)
        ]);

        await cleanupAbandonedUploads();

        th.s3.checkNbCalls({ nbCalls: 0 });
        await th.mysql.checkTableLength('Clipboard', 2);
        await th.mysql.checkTableLength('S3Files', 1);
    });

    it('does not touch a pending upload of another bucket', async () => {
        await th.mysql.fixture({
            Clipboard: [],
            S3Files: [
                {
                    bucket: 'reactor',
                    s3Key: 'other.png',
                    creationDateUnix: now() - 2 * 3600,
                    uploadedDateUnix: null
                }
            ]
        });

        await cleanupAbandonedUploads();

        th.s3.checkNbCalls({ nbCalls: 0 });
        await th.mysql.checkTableLength('S3Files', 1);
    });

    it('keeps the rows when the S3 delete fails and still processes the other entries', async () => {
        await fixture([
            entry(1, 'shouldfail.png', 2 * 3600, null),
            entry(2, 'stale.png', 2 * 3600, null)
        ]);

        await cleanupAbandonedUploads();

        th.s3.checkNbCalls({ nbCalls: 2 });
        await th.mysql.checkContains({
            Clipboard: [{ id: 1, s3Key: 'shouldfail.png' }],
            S3Files: [{ s3Key: 'shouldfail.png', uploadedDateUnix: null }]
        });
        await th.mysql.checkTableLength('Clipboard', 1);
        await th.mysql.checkTableLength('S3Files', 1);
        th.slog.checkLog('clipboard', 'Failed to delete abandoned upload', {
            entryName: 'entry 1',
            s3Key: 'shouldfail.png'
        });
        th.push.checkNotification({
            title: 'Clipboard',
            message: 'Failed to clean up abandoned upload "entry 1" (shouldfail.png)'
        });
        th.push.checkNbNotifications(1);
    });
});
