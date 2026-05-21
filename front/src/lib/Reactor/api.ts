import { client2 } from '$lib/api';

export const getReactionsForPublic = client2.reactor.getEntriesForPublic;
export const uploadToReactor = client2.reactor.addEntry;
