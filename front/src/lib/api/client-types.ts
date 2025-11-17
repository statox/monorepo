export type Auth_Login_Input = {
    username: string;
    password: string;
};

export type HomeTracker_HistogramData_Input = {
    timeWindow: '30m' | '3h' | '12h' | '1d' | '3d' | '7d' | '2w' | '6M' | 'alltime';
};

export type HomeTracker_HistogramDataPublic_Input = {
    timeWindow: '30m' | '3h' | '12h' | '1d' | '3d' | '7d' | '2w';
};

export type HomeTracker_UpdateSensorMetadata_Input = {
    sensorName: string;
    hexColor: string;
    tempOffset: number;
    sleepTimeSec: number;
};
