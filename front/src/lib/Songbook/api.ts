import { client2 } from '$lib/api';
import type { Chord, RawChord } from './types';

const getType = (chord: RawChord) => {
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

export const getChords = client2.chords.getAll;

export const getSongbook = async (): Promise<Chord[]> => {
    const chords = await getChords();

    return chords.map((chord: RawChord) => {
        return {
            ...chord,
            type: getType(chord)
        };
    });
};

export const getLinksChecks = client2.chords.checkLinks;

export const addChord = client2.chords.addEntry;

export const uploadLinkVisit = client2.chords.addLinkVisit;
