import { getChord, type Chord } from '$lib/Songbook';
import type { PageLoad } from './$types';

export const prerender = false;
export const csr = true;
export const ssr = false; // Avoid calling API's /chords/getEntry at build time
export const load: PageLoad = async ({ params }): Promise<{ chord: Chord | undefined }> => {
    try {
        const chord = await getChord(Number(params.id));
        return { chord };
    } catch {
        return { chord: undefined };
    }
};
