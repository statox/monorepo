export type Chord = {
    id: number;
    artist: string;
    title: string;
    url: string;
    tags: string[];
    creationDateUnix: number;
    visitsCount: number;
    lastAccessDateUnix: number | null;
};
