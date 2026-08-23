import type { Chord, FilterType } from '$lib/Songbook';

export const getTypeIconClass = (type: FilterType) => {
    if (type === 'doc') {
        return 'fas fa-file-word';
    }
    if (type === 'pdf') {
        return 'fas fa-file-pdf';
    }
    if (type === 'youtube') {
        return 'fa fa-youtube';
    }
    return 'fas fa-link';
};

export const getChordIcon = (chord: Chord) => {
    if (chord.contentB64) {
        return 'fas fa-book-open';
    }

    return getTypeIconClass(chord.type);
};
