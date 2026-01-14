import { getChords, type RawChord } from '$lib/Songbook';
import type { PageLoad } from './$types';

export const ssr = false; // Avoid calling API's /chords/getAll at build time
export const load: PageLoad = async (): Promise<{ chords: RawChord[] }> => {
    const chords = await getChords();
    return { chords };
};
