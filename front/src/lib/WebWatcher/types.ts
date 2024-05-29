export interface WatchedContent {
    id: number;
    name: string;
    notificationMessage: string;
    url: string;
    cssSelector: string;
    lastContent: string;
    lastCheckDateUnix: number;
    lastUpdateDateUnix: number;
    checkIntervalSeconds: number;
    lastErrorDateUnix: number;
    lastErrorMessage: string;
}

export interface NewWatcherParams {
    name: string;
    notificationMessage: string;
    url: string;
    cssSelector: string;
    checkIntervalSeconds: number;
}
