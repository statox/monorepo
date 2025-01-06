export interface NewEventParams {
    timestampUTC: number;
    type: string;
    value: number;
}

export interface PersonalEvent {
    eventDateUnix: number;
    type: string;
    value: number;
}
