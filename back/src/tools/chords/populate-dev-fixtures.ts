import { addChord } from '../../libs/modules/chords/index.js';
import { AppError } from '../../libs/errors/AppError.js';

const fixtureChords: { artist: string; title: string; url: string; tags: string[] }[] = [
    {
        artist: 'Georges Brassens',
        title: 'Les passantes (tabs)',
        url: 'https://www.songsterr.com/a/wsa/georges-brassens-les-passantes-tab-s3388t2',
        tags: ['slow', 'chill', 'romantic']
    },
    {
        artist: 'Georges Brassens',
        title: 'Les passantes (chords)',
        url: 'https://tabs.ultimate-guitar.com/tab/georges-brassens/les-passantes-chords-1429512',
        tags: ['slow', 'chill', 'romantic']
    },
    {
        artist: 'Wendy Rene',
        title: 'After Laughter',
        url: 'https://tabs.ultimate-guitar.com/tab/wendy-rene/after-laughter-chords-1746557',
        tags: ['slow', 'reggae', 'vocal', 'sad']
    },
    {
        artist: 'The Statler Brothers',
        title: 'Flowers On The Wall Chords',
        url: 'https://tabs.ultimate-guitar.com/tab/the-statler-brothers/flowers-on-the-wall-chords-913105',
        tags: ['happy', 'quick', 'country']
    },
    {
        artist: 'Strawbs',
        title: 'Part of the union',
        url: 'https://tabs.ultimate-guitar.com/tab/strawbs/part-of-the-union-chords-1489944',
        tags: ['happy', 'loud']
    },
    {
        artist: 'Leonard Cohen',
        title: 'Suzanne',
        url: 'https://tabs.ultimate-guitar.com/tab/leonard-cohen/suzanne-chords-29753',
        tags: []
    },
    {
        artist: 'Rodriguez',
        title: 'Sugar man',
        url: 'https://tabs.ultimate-guitar.com/tab/rodriguez/sugar-man-chords-811245',
        tags: []
    },
    {
        artist: 'Talking heads',
        title: 'Psycho killer',
        url: 'https://tabs.ultimate-guitar.com/tab/talking-heads/psycho-killer-chords-435224',
        tags: []
    }
];

export const populateFakeChordsData = async () => {
    console.log(`Chords - Populating ${fixtureChords.length} dev fixtures`);

    let created = 0;
    let skipped = 0;

    for (const chord of fixtureChords) {
        try {
            await addChord(chord);
            created++;
        } catch (error) {
            if (error instanceof AppError && error.code === 'ITEM_ALREADY_EXISTS') {
                skipped++;
                continue;
            }
            throw error;
        }
    }

    console.log(
        `Chords - Done populating dev fixtures (${created} created, ${skipped} already existed)`
    );
};
