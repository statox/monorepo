export type Chord = {
    artist: string;
    title: string;
    url: string;
    creationDate: number;
    tags: string[];
};

export type ChordData = {
    count: number;
    lastAccessDateUnix: number;
};
