import type { PageLoad } from './$types';
import type { Chord } from '$lib/Music/Chords//types';

const CHORDS_URL = 'https://raw.githubusercontent.com/statox/blog/master/src/_data/chords.json';

export const load: PageLoad = async (): Promise<{ chords: Chord[] }> => {
    const chords = await fetch(CHORDS_URL).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response.json();
    });
    // TODO Add type checking
    const data = { chords };
    return { chords };
};
