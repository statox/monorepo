import { requestAPIGet, requestAPIPost } from '$lib/api';
import type { NewEventParams, PersonalEvent } from './types';

export const createEvent = async (event: NewEventParams) => {
    return requestAPIPost<void>({
        path: '/personalTracker/upload',
        data: { event },
        isUnauthenticatedCall: true
    });
};

export const getAllEvents = async () => {
    const { events } = await requestAPIGet<{ events: PersonalEvent[] }>({
        path: '/personalTracker/getAll'
    });
    return events;
};
