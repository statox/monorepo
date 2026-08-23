export type Chord = {
    id: number;
    artist: string;
    title: string;
    url: string;
    tags: string[];
    contentB64: string | null;
    creationDateUnix: number;
    visitsCount: number;
    lastAccessDateUnix: number | null;
};

export type ExtractionResult = {
    status: 'OK' | 'SKIPPED' | 'FAILED';
    label: string;
    reason: string;
};
