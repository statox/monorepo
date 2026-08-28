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

export const getSongbook = async (): Promise<Chord[]> => {
    const chords = await client2.chords.getAll();

    return chords.map((chord: RawChord) => {
        return {
            ...chord,
            type: getType(chord)
        };
    });
};

export const getChordEntry = client2.chords.getEntry;

export const getChord = async (id: number): Promise<Chord> => {
    const chord = await getChordEntry({ id });

    return {
        ...chord,
        type: getType(chord)
    };
};

export const getLinksChecks = client2.chords.checkLinks;

export const addChord = client2.chords.addEntry;

export const updateChord = client2.chords.updateEntry;

export const deleteChord = client2.chords.deleteEntry;

export const extractChordEntry = client2.chords.extractEntry;

export const uploadLinkVisit = client2.chords.addLinkVisit;
