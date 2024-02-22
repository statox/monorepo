import { requestAPIGet, requestAPIPost } from '$lib/api';
import type { Chord, ChordVisitItem, LinksChecks } from './types';

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

export const getChords = async () => {
    return requestAPIGet<RawChord[]>({ path: '/chords/getAll' });
};

export const getSongbook = async (): Promise<Chord[]> => {
    const chords = await getChords();

    return chords.map((chord: RawChord) => {
        return {
            ...chord,
            type: getType(chord)
        };
    });
};

export const getLinksVisitsCount = () => {
    return requestAPIGet<ChordVisitItem[]>({ path: '/chords/getLinksVisitsCount' });
};

export const getLinksChecks = () => {
    return requestAPIGet<LinksChecks>({ path: '/chords/checkLinks' });
};

export const uploadChords = (chords: RawChord[]) => {
    return requestAPIPost({ path: '/chords/updateAll', data: { chords } });
};

export const uploadLinkVisit = (chordUrl: string) => {
    return requestAPIPost({ path: '/chords/addLinkVisit', data: { url: chordUrl } });
};
