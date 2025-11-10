import { client } from '$lib/api';

export const createEvent = client.personalTracker.upload;

export const getAllEvents = async () => {
    const { events } = await client.personalTracker.getAll();
    return events;
};
