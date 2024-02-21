export type FilterType = 'link' | 'doc' | 'pdf' | 'youtube';

export type Filters = Record<FilterType, boolean>;

export type RawChord = {
    artist: string;
    title: string;
    url: string;
    creationDate: number;
    tags: string[];
};

export type Chord = RawChord & {
    type: FilterType;
};

export type ChordData = {
    count: number;
    lastAccessDateUnix: number;
};

export type ChordVisitItem = {
    url: string;
    count: number;
    lastAccessDateUnix: number;
};

export type LinksChecks = {
    nbChecks: number;
    nbSkipped: number;
    fails: {
        status: string;
        error: any;
        chord: Chord;
    }[];
    nbFails: number;
    timestamp: number;
};
