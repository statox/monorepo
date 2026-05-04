import { db } from '../../databases/db.js';
import { WatchedContent, WatchType } from './types.js';
import { handleDuplicateEntry } from '../../errors/dbHelpers.js';

export const getWatchedContent = async () => {
    const [content] = await db.query<WatchedContent[]>(
        `SELECT 
            id,
            name,
            notificationMessage,
            url,
            watchType,
            cssSelector,
            lastContent,
            lastCheckDateUnix,
            lastUpdateDateUnix,
            archivalDateUnix,
            checkIntervalSeconds,
            lastErrorDateUnix,
            lastErrorMessage
        FROM WebWatcher
        `
    );
    return content;
};

export const getEnabledWatchedContent = async () => {
    const [content] = await db.query<WatchedContent[]>(
        `SELECT
            id,
            name,
            notificationMessage,
            url,
            watchType,
            cssSelector,
            lastContent,
            lastCheckDateUnix,
            lastUpdateDateUnix,
            archivalDateUnix,
            checkIntervalSeconds,
            lastErrorDateUnix,
            lastErrorMessage
        FROM WebWatcher
        WHERE
            archivalDateUnix IS NULL
        `
    );
    return content;
};

interface NewWatcherParams {
    name: string;
    notificationMessage: string;
    url: string;
    watchType: WatchType;
    cssSelector?: string;
    checkIntervalSeconds: number;
}

export const createWatcher = async (newWatcherParams: NewWatcherParams) => {
    const {
        name,
        notificationMessage,
        url,
        watchType,
        cssSelector = '',
        checkIntervalSeconds
    } = newWatcherParams;

    try {
        await db.query(
            `INSERT INTO WebWatcher
            (name, notificationMessage, url, watchType, cssSelector, checkIntervalSeconds)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [name, notificationMessage, url, watchType, cssSelector, checkIntervalSeconds]
        );
    } catch (error) {
        handleDuplicateEntry(error, 'ITEM_ALREADY_EXISTS');
    }
};

export const deleteWatcher = async (watcherId: number) => {
    return db.query(`DELETE FROM WebWatcher WHERE id = ?`, watcherId);
};

export const disableWatcher = async (watcherId: number) => {
    return db.query(
        'UPDATE WebWatcher SET archivalDateUnix = UNIX_TIMESTAMP() WHERE id = ?',
        watcherId
    );
};

export const enableWatcher = async (watcherId: number) => {
    return db.query('UPDATE WebWatcher SET archivalDateUnix = null WHERE id = ?', watcherId);
};
