import { PUBLIC_API_URL } from '$env/static/public';
import { getAccessToken } from '$lib/auth/service';
import type { Chord, ChordVisitItem } from './types';

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

export const getChords = async (): Promise<RawChord[]> => {
    const url = PUBLIC_API_URL + '/chords/getAll';

    return await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(async (response) => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(await response.text());
    });
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

export const getLinksVisitsCount = async (): Promise<ChordVisitItem[]> => {
    const COUNTS_URL = PUBLIC_API_URL + '/chords/getLinksVisitsCount';
    return fetch(COUNTS_URL, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(async (response) => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(await response.text());
    });
};

export const uploadChords = async (chords: RawChord[]) => {
    const body = JSON.stringify({ chords });
    const url = PUBLIC_API_URL + '/chords/updateAll';
    const token = await getAccessToken();
    return fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body
    }).then(async (response) => {
        if (response.ok) {
            return;
        }
        throw new Error(await response.text());
    });
};
