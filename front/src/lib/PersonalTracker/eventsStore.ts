import { writable, get } from 'svelte/store';
import { getAndDecryptEvents, type PersonalTrackerEvent } from './service';

interface EventsState {
    events: PersonalTrackerEvent[];
    loading: boolean;
    error: Error | null;
}

const createEventsStore = () => {
    const { subscribe, set, update } = writable<EventsState>({
        events: [],
        loading: false,
        error: null
    });

    let lastPassword = '';
    let isFetching = false;

    return {
        subscribe,

        /**
         * Fetch and cache events for the given password.
         * - Only fetches if cache is empty or password changed
         * - Prevents duplicate fetches if already loading
         */
        fetch: async (password: string) => {
            // If password changed, clear cache
            if (lastPassword !== password) {
                lastPassword = password;
                set({ events: [], loading: false, error: null });
            }

            const state = get({ subscribe });

            // Skip if already have data or currently fetching
            if (state.events.length > 0 || isFetching) {
                return;
            }

            isFetching = true;
            update((s) => ({ ...s, loading: true, error: null }));

            try {
                const events = await getAndDecryptEvents(password);
                set({ events, loading: false, error: null });
            } catch (error) {
                console.error('Failed to fetch events:', error);
                set({ events: [], loading: false, error: error as Error });
            } finally {
                isFetching = false;
            }
        },

        /**
         * Invalidate the cache, forcing next fetch to reload from server.
         * Call this after creating or updating an event.
         */
        invalidate: () => {
            update((s) => ({ ...s, events: [] }));
        },

        /**
         * Reset the store to initial state.
         * Useful when logging out or clearing password.
         */
        reset: () => {
            lastPassword = '';
            isFetching = false;
            set({ events: [], loading: false, error: null });
        }
    };
};

export const eventsStore = createEventsStore();
