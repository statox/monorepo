import { cleanupAbandonedUploads } from '../../../src/libs/modules/reactor/index.js';
import { th } from '../../helpers/index.js';

const now = () => Math.round(Date.now() / 1000);

const entry = (
    id: number,
    s3Key: string,
    createdAgoSec: number,
    uploadedDateUnix: number | null
) => ({
    reactor: {
        id,
        name: `entry ${id}`,
        tags: '[]',
        creationDateUnix: now() - createdAgoSec,
        linkId: `0000000${id}`,
        s3Key
    },
    s3File: { bucket: 'reactor', s3Key, creationDateUnix: now() - createdAgoSec, uploadedDateUnix }
});

const fixture = async (entries: ReturnType<typeof entry>[]) => {
    await th.mysql.fixture({
        Reactor: entries.map((e) => e.reactor),
        S3Files: entries.map((e) => e.s3File)
    });
};

describe('periodic task - cleanupAbandonedUploads', () => {
    it('deletes a pending upload older than one hour', async () => {
        await fixture([entry(1, 'stale.png', 2 * 3600, null)]);

        await cleanupAbandonedUploads();

        th.s3.checkNbCalls({ nbCalls: 1 });
        th.s3.checkCall({
            commandType: 'DeleteObject',
            input: { Bucket: 'reactor', Key: 'stale.png' }
        });
        await th.mysql.checkTableLength('Reactor', 0);
        await th.mysql.checkTableLength('S3Files', 0);
        th.slog.checkLog('reactor', 'Deleted abandoned upload', {
            entryName: 'entry 1',
            s3Key: 'stale.png'
        });
        th.push.checkNoNotifications();
    });

    it('keeps a pending upload younger than one hour', async () => {
        await fixture([entry(1, 'fresh.png', 10 * 60, null)]);

        await cleanupAbandonedUploads();

        th.s3.checkNbCalls({ nbCalls: 0 });
        await th.mysql.checkTableLength('Reactor', 1);
        await th.mysql.checkTableLength('S3Files', 1);
    });

    it('keeps an old confirmed upload', async () => {
        await fixture([entry(1, 'confirmed.png', 2 * 3600, now() - 2 * 3600 + 30)]);

        await cleanupAbandonedUploads();

        th.s3.checkNbCalls({ nbCalls: 0 });
        await th.mysql.checkTableLength('Reactor', 1);
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
            Reactor: [{ id: 1, s3Key: 'shouldfail.png' }],
            S3Files: [{ s3Key: 'shouldfail.png', uploadedDateUnix: null }]
        });
        await th.mysql.checkTableLength('Reactor', 1);
        await th.mysql.checkTableLength('S3Files', 1);
        th.slog.checkLog('reactor', 'Failed to delete abandoned upload', {
            entryName: 'entry 1',
            s3Key: 'shouldfail.png'
        });
        th.push.checkNotification({
            title: 'Reactor',
            message: 'Failed to clean up abandoned upload "entry 1" (shouldfail.png)'
        });
        th.push.checkNbNotifications(1);
    });
});
