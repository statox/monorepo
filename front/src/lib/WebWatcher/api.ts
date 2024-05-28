import { requestAPIGet, requestAPIPost } from '$lib/api';
import type { NewWatcherParams, WatchedContent } from './types';

export const getAllWatchers = async () => {
    return await requestAPIGet<WatchedContent[]>({ path: '/webWatcher/getAllWatchers' });
};

export const createWatcher = async (newWatcher: NewWatcherParams) => {
    return requestAPIPost<void>({ path: '/webWatcher/createWatcher', data: newWatcher });
};
