import type { PageLoad } from './$types';
import type { Chord } from '$lib/Chords//types';

const CHORDS_URL = 'https://raw.githubusercontent.com/statox/blog/master/src/_data/chords.json';

export const load: PageLoad = async (): Promise<{ chords: Chord[]; lastCheckChords: any }> => {
    const lastCheckChords = await getLastCheckChordsWorkflow();
    const chords = await fetch(CHORDS_URL).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response.json();
    });
    // TODO Add type checking
    return { chords, lastCheckChords };
};

const WORKFLOW_URL = 'https://api.github.com/repos/statox/workshop/actions/runs';
const getLastCheckChordsWorkflow = async () => {
    const reponse = await fetch(WORKFLOW_URL, {
        headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
    const result = await reponse.json();

    return result.workflow_runs
        .filter((run: any) => run.name === 'Check chords.json for dead links')
        .sort((a: any, b: any) => b.id - a.id)[0];
};
