import type { Chord } from '../types';

const CHORDS_URL = 'https://raw.githubusercontent.com/statox/blog/master/src/_data/chords.json';

export const load = async (): Promise<Chord[]> => {
    const chords = await fetch(CHORDS_URL).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response.json();
    });
    return chords;
};

const chords = await load();

const checkChordUrl = async (chord: Chord) => {
    if (chord.url.match('s3.eu-west-3')) {
        return;
    }

    return fetch(chord.url)
        .then((response) => {
            if (response.status !== 200) {
                return chord;
            }
        })
        .catch((response) => {
            return chord;
        });
};

const getFailingUrls = async () => {
    return Promise.all(chords.map((c) => checkChordUrl(c))).then((result) => {
        return result.filter((v) => v);
    });
};

const fails = await getFailingUrls();
if (!fails.length) {
    console.log('All urls are available!');
} else {
    console.log(fails.length, 'urls are failing');
    console.log(fails);
}
process.exit(0);
