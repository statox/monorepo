import { requestAPIPost } from '$lib/api';
import type { NewEventParams } from './types';

export const createEvent = async (newEvent: NewEventParams) => {
    return requestAPIPost<void>({
        path: '/personalTracker/upload',
        data: newEvent
    });
};
