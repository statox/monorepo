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
        return { status: 'skipped' };
    }

    return fetch(chord.url)
        .then((response) => {
            if (response.status !== 200) {
                return { status: response.status.toString(), chord };
            }
            return { status: 'ok' };
        })
        .catch((error) => {
            return { status: 'error', chord, error };
        });
};

const getFailingUrls = async () => {
    return Promise.all(chords.map((c) => checkChordUrl(c))).then((result) => {
        const nbChecks = result.length;
        const nbSkipped = result.filter((r) => r.status === 'skipped').length;
        const fails = result.filter((r) => !['ok', 'skipped'].includes(r.status.toString()));
        const nbFails = fails.length;

        return {
            nbChecks,
            nbSkipped,
            fails,
            nbFails
        };
    });
};

const results = await getFailingUrls();
if (!results.fails.length) {
    console.log(JSON.stringify(results, null, 2));
    console.log('All urls are available!');
    process.exit(0);
}

for (const fail of results.fails) {
    console.log(JSON.stringify(fail, null, 2));
}
console.log(results.nbFails, 'urls are failing');
process.exit(1);
