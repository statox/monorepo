export type FilterType = 'link' | 'doc' | 'pdf' | 'youtube';

export type Filters = Record<FilterType, boolean>;

export type Chord = {
    artist: string;
    title: string;
    url: string;
    creationDate: number;
    tags: string[];
    type: FilterType;
};

export type ChordData = {
    count: number;
    lastAccessDateUnix: number;
};
