import { client2 } from '$lib/api';

export const createEvent = client2.personalTracker.upload;

export const getAllEvents = async () => {
    const { events } = await client2.personalTracker.getAll();
    return events;
};
