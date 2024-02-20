export interface ReactorEntryForPublic {
    name: string;
    tags: string[];
    creationDateUnix: number;
    s3PresignedUrl: string;
}

export type ReactorUploadData = {
    name: string;
    commaSeparatedTags: string;
    file: File;
};
