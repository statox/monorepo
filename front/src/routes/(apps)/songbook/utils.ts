import type { FilterType } from '$lib/Songbook';

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
