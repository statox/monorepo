import { addChord } from './commands.js';
import { extractChordData } from './extraction.js';

export const insertChordAndExtractContent = async (params: {
    artist: string;
    title: string;
    url: string;
    tags: string[];
}) => {
    const newChordId = await addChord(params);
    const res = await extractChordData(newChordId);

    return res;
};
