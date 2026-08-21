import { writable } from 'svelte/store';
import type { ChordMetadata } from '$lib/Songbook';

export const visitCountsStore = writable<Map<number, ChordMetadata>>();

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
 *
 * TODO: In november 2025 I'm removing auth0 to use session cookie auth so
 *       there is not redirect to an outside domain anymore, so we could avoid
 *       storing the store in local storage. For now it works well tho so
 *       I'm not touching it yet
 */
let failedVisitCountsInitValue = [] as number[];
const failedVisitCountsStr = localStorage.getItem('failedVisitCounts');
if (failedVisitCountsStr !== null) {
    try {
        const parsed = JSON.parse(failedVisitCountsStr) as unknown;
        // Sanitize: this key predates the id-based API and could still hold
        // leftover url strings from before the deploy migrating it to number[].
        failedVisitCountsInitValue = Array.isArray(parsed)
            ? parsed.filter((v): v is number => typeof v === 'number')
            : [];
    } catch (e) {
        console.error('Couldnt parse failedVisitCounts from local storage');
    }
}

export const failedVisitCounts = writable<number[]>(failedVisitCountsInitValue);

failedVisitCounts.subscribe((value) => {
    localStorage.setItem('failedVisitCounts', JSON.stringify(value));
});
