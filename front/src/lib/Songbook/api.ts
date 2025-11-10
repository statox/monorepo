import { client } from '$lib/api';
import type { Chord } from './types';

type RawChord = {
    artist: string;
    title: string;
    url: string;
    creationDate: number;
    tags: string[];
};

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

export const getChords = client.chords.getAll;

export const getSongbook = async (): Promise<Chord[]> => {
    const chords = await getChords();

    return chords.map((chord: RawChord) => {
        return {
            ...chord,
            type: getType(chord)
        };
    });
};

export const getLinksVisitsCount = client.chords.getLinksVisitsCount;

export const getLinksChecks = client.chords.checkLinks;

export const uploadChords = client.chords.updateAll;

export const uploadLinkVisit = client.chords.addLinkVisit;
