import type { PageLoad } from './$types';
import type { Chord } from '$lib/SongBook/types';

const CHORDS_URL = 'https://raw.githubusercontent.com/statox/blog/master/src/_data/chords.json';

export const load: PageLoad = async (): Promise<{ chords: Chord[]; lastCheckChords: any }> => {
    const lastCheckChords = await getLastCheckChords();
    const chords = await fetch(CHORDS_URL).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response.json();
    });
    // TODO Add type checking
    return { chords, lastCheckChords };
};

const CHORDS_CHECK_URL = 'https://statox-backend-631a602a9744.herokuapp.com/checkChordsUrl';
const getLastCheckChords = async () => {
    return await fetch(CHORDS_CHECK_URL)
        .then((response) => response.json())
        .catch((error) => error);
};
