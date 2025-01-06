import { requestAPIGet, requestAPIPost } from '$lib/api';
import type { NewEventParams, PersonalEvent } from './types';

export const createEvent = async (event: NewEventParams) => {
    return requestAPIPost<void>({
        path: '/personalTracker/upload',
        data: { event }
    });
};

export const getAllEvents = async () => {
    return await requestAPIGet<PersonalEvent[]>({
        path: '/personalTracker/getAll',
        authorize: true
    });
};
