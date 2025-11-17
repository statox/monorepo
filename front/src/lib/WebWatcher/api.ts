import { client2 } from '$lib/api';

export const getAllWatchers = client2.webWatcher.getAllWatchers;

export const createWatcher = client2.webWatcher.createWatcher;

export const deleteWatcherAPI = client2.webWatcher.deleteWatcher;

export const toggleWatcherEnabledAPI = client2.webWatcher.toggleWatcherEnabled;
