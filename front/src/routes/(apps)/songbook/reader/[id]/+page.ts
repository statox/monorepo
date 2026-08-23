import { getSongbook, type Chord } from '$lib/Songbook';
import type { PageLoad } from './$types';

export const prerender = false;
export const csr = true;
export const ssr = false; // Avoid calling API's /chords/getAll at build time
export const load: PageLoad = async ({ params }): Promise<{ chord: Chord | undefined }> => {
    try {
        const chords = await getSongbook();
        const chord = chords.find((c) => c.id === Number(params.id));
        return { chord };
    } catch {
        return { chord: undefined };
    }
};
