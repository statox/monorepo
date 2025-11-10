import { client } from '$lib/api';

export const getAllWatchers = client.webWatchers.getAllWatchers;

export const createWatcher = client.webWatchers.createWatcher;

export const deleteWatcherAPI = client.webWatchers.deleteWatcher;

export const toggleWatcherEnabledAPI = client.webWatchers.toggleWatcherEnabled;
