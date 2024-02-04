import { getChords } from '$lib/Songbook/api';
import type { RawChord } from '$lib/Songbook/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async (): Promise<{ chords: RawChord[] }> => {
    const chords = await getChords();
    return { chords };
};
