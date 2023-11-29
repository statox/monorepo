import type { PageLoad } from './$types';
import type { Chord } from '$lib/SongBook/types';

const CHORDS_URL = 'https://raw.githubusercontent.com/statox/blog/master/src/_data/chords.json';

export const load: PageLoad = async (): Promise<{ chords: Chord[]; lastChordsCheck: any }> => {
    const lastChordsCheck = await getLastChordsCheck();
    const chords = await fetch(CHORDS_URL).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response.json();
    });
    // TODO Add type checking
    return { chords, lastChordsCheck };
};

const CHORDS_CHECK_URL = 'https://statox-backend-631a602a9744.herokuapp.com/checkChordsUrl';
const getLastChordsCheck = async () => {
    return await fetch(CHORDS_CHECK_URL)
        .then((response) => response.json())
        .catch((error) => null);
};
