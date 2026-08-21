type CloudflareGeoInfo = {
    'cf-ipcity'?: string;
    'cf-ipcontinent'?: string;
    'cf-ipcountry'?: string;
    'cf-ipGeoPoint'?: {
        lat: number;
        lon: number;
    };
    'cf-region-code'?: string;
};
type xRequestInfo = {
    'x-request-id'?: string;
    'x-request-start'?: number;
};

export type LoggableProperties = {
    context?: LoggableProperties;

    action?: string;
    app?: string;
    authError?: Error;
    authType?: string;
    authUserScopes?: string[];
    authValidatedScope?: boolean;
    authValidatedSession?: boolean;
    bucket?: string;
    cfGeoInfo?: CloudflareGeoInfo;
    cfRay?: string;
    clientId?: string;
    code?: number;
    chords_newChordArtist?: string;
    chords_newChordTags?: string[];
    chords_newChordTitle?: string;
    chords_newChordUrl?: string;
    cookbook_duplicateIngredient?: string;
    cookbook_nbIngredients?: number;
    cookbook_newRecipeId?: number;
    cookbook_newRecipeName?: string;
    dataStr?: string;
    delayMs?: number;
    enabled?: boolean;
    entryName?: string;
    error?: Error;
    errorCode?: string;
    eventTS?: number;
    eventType?: string;
    eventValue?: number;
    eventDataStr?: string;
    executionTimeMs?: number;
    failedCalls?: number;
    forecast?: string;
    gameId?: string;
    httpMethod?: string;
    id?: number;
    insertTime?: string;
    instructSleepSec?: number;
    invalidField?: string;
    invalidValueStr?: string;
    lastAlertDateUnix?: number;
    lastSyncDateUnix?: number;
    linkId?: string;
    livemode?: boolean;
    meanWindDirectionDegrees?: number;
    meanWindSpeedMS?: number;
    mimetype?: string;
    nbChords?: number;
    notification?: string;
    originalError?: Error;
    originalMessage?: string;
    path?: string;
    playerId?: number;
    port?: number;
    precipitationMM?: number;
    pressureLatest?: number;
    pressureOldest?: number;
    pressurehPa?: number;
    previousStatus?: string;
    previousTimestamp?: number;
    referenceTime?: string;
    remoteIp?: string;
    /**
     * In debug mode the schemaValidation middleware logs the request body
     * Only set this properly when isDebug is true
     */
    requestBody_DANGER?: string;
    requestId?: string;
    requestInterrupted?: boolean;
    requiredScope?: string;
    s3Key?: string;
    sensorName?: string;
    shutdownOrigin?: NodeJS.Signals | NodeJS.UncaughtExceptionOrigin;
    station?: string;
    stationId?: string;
    stationName?: string;
    status?: string;
    taskName?: string;
    timestamp?: number;
    timestampLatest?: number;
    timestampOldest?: number;
    timewindow?: string;
    timewindowStartMs?: number;
    timewindowEndMs?: number;
    trend?: string;
    url?: string;
    userId?: number;
    userScopes?: string[];
    validityTime?: string;
    visitedUrl?: string;
    watcherName?: string;
    xRequestInfo?: xRequestInfo;
    zValue?: number;
};

export type AppLogComponent =
    | 'app'
    | 'auth'
    | 'chords'
    | 'debug'
    | 'env-helpers'
    | 'gravitrips'
    | 'home-tracker'
    | 'meteo-france'
    | 'middleware'
    | 'notifier'
    | 'periodic-tasks'
    | 'reactor'
    | 's3Files'
    | 'weather-forecast'
    | 'web-stats'
    | 'web-watcher'
    | 'ws';

export type LogObject = { component: AppLogComponent; message: string } | LoggableProperties;
