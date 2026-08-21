export type FilterType = 'link' | 'doc' | 'pdf' | 'youtube';

export type Filters = Record<FilterType, boolean>;

export type RawChord = {
    id: number;
    artist: string;
    title: string;
    url: string;
    tags: string[];
    creationDateUnix: number;
    visitsCount: number;
    lastAccessDateUnix: number | null;
};

export type Chord = RawChord & {
    type: FilterType;
};

export type ChordMetadata = {
    count: number;
    lastAccessDateUnix: number;
};

export type LinksChecks = {
    nbChecks: number;
    nbSkipped: number;
    fails: {
        status: string;
        error?: any;
        chord: RawChord;
    }[];
    nbFails: number;
    timestamp: number;
};
