export type ClipboardEntry = {
    id: number;
    name: string;
    content: string;
    creationDateUnix: number;
    ttl: number;
    isPublic: boolean;
    linkId: string;
};

export type ClipboardUploadData = {
    name: string;
    content: string;
    ttlSeconds: number;
    isPublic: boolean;
};
