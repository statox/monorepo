import type { PageLoad } from './$types';
import type { Chord } from './types';

const CHORDS_URL = 'https://raw.githubusercontent.com/statox/blog/master/src/_data/chords.json';

export const load: PageLoad = async ({ fetch }): Promise<{ chords: Chord[] }> => {
    const chords = await fetch(CHORDS_URL).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response.json();
    });

    // TODO Add type checking
    return { chords };
};
