import { requestAPIPost } from '$lib/api';
import type { NewEventParams } from './types';

export const createEvent = async (event: NewEventParams) => {
    return requestAPIPost<void>({
        path: '/personalTracker/upload',
        data: { event }
    });
};
