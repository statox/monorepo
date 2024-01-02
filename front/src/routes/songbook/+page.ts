import type { PageLoad } from './$types';
import type { Chord } from './types';

const CHORDS_URL = 'https://raw.githubusercontent.com/statox/blog/master/src/_data/chords.json';

export const load: PageLoad = async ({ fetch }): Promise<{ chords: Chord[] }> => {
    let chords = await fetch(CHORDS_URL).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response.json();
    });

    const getType = (chord: Chord) => {
        const url = chord.url;
        if (url.includes('.doc')) {
            return 'doc';
        }
        if (url.includes('.pdf')) {
            return 'pdf';
        }
        if (url.includes('youtube')) {
            return 'youtube';
        }
        return 'link';
    };

    chords = chords.map((chord: Chord) => {
        return {
            ...chord,
            type: getType(chord)
        };
    });

    // TODO Add type checking
    return { chords };
};
