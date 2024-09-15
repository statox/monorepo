import { requestAPIGet, requestAPIPost } from '$lib/api';
import type { NewWatcherParams, WatchedContent } from './types';

export const getAllWatchers = async () => {
    return requestAPIGet<WatchedContent[]>({ path: '/webWatcher/getAllWatchers' });
};

export const createWatcher = async (newWatcher: NewWatcherParams) => {
    return requestAPIPost<void>({ path: '/webWatcher/createWatcher', data: newWatcher });
};

export const deleteWatcherAPI = async (watcherId: number) => {
    return requestAPIPost<void>({ path: '/webWatcher/deleteWatcher', data: { id: watcherId } });
};

export const toggleWatcherEnabledAPI = async (data: {
    watcherId: number;
    setToEnabled: boolean;
}) => {
    return requestAPIPost<void>({ path: '/webWatcher/toggleWatcherEnabled', data });
};
