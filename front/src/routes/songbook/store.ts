import { writable } from 'svelte/store';
import type { ChordData } from '$lib/Songbook/types';

export const visitCountsStore = writable<Map<string, ChordData>>();

/*
 * The store failedVisitCountsInitValue is updated in 2 places:
 * - The ChordLink component when it fails uploadLinkVisit() (usually because user is
 *   not logged in) so that we can retry next time we load the page
 * - The Songbook +page.svelte on mount: After the user logs in we are redirected
 *   to the main page so when navigating again to the Songbook page we re-trigger
 *   the onMount event. So this event tries to upload the links in this store.
 *
 * But for a user to log in, we need to redirect to the auth0.com domain, so the
 * store is lost from memory, so we need to persist this store to local storage
 * to be able to retry the failed visits.
 */
let failedVisitCountsInitValue = [] as string[];
const failedVisitCountsStr = localStorage.getItem('failedVisitCounts');
if (failedVisitCountsStr !== null) {
    try {
        failedVisitCountsInitValue = JSON.parse(failedVisitCountsStr) as string[];
    } catch (e) {
        console.error('Couldnt parse failedVisitCounts from local storage');
    }
}

export const failedVisitCounts = writable<string[]>(failedVisitCountsInitValue);

failedVisitCounts.subscribe((value) => {
    localStorage.setItem('failedVisitCounts', JSON.stringify(value));
});
