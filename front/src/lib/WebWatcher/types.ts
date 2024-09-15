export type WatchType = 'CSS' | 'HASH';

export interface WatchedContent {
    id: number;
    name: string;
    notificationMessage: string;
    url: string;
    watchType: WatchType;
    cssSelector: string;
    lastContent: string;
    lastCheckDateUnix: number;
    lastUpdateDateUnix: number;
    archivalDateUnix: number;
    checkIntervalSeconds: number;
    lastErrorDateUnix: number;
    lastErrorMessage: string;
}

export interface BaseNewWatcherParams {
    name: string;
    notificationMessage: string;
    url: string;
    watchType: WatchType;
    checkIntervalSeconds: number;
}

export interface NewCSSWatcherParams extends BaseNewWatcherParams {
    watchType: 'CSS';
    cssSelector: string;
}

export interface NewHASHWatcherParams extends BaseNewWatcherParams {
    watchType: 'HASH';
}

export type NewWatcherParams = NewCSSWatcherParams | NewHASHWatcherParams;
