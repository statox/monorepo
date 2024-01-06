export type ClipboardEntry = {
    id: number;
    name: string;
    content: string;
    creationDateUnix: number;
    ttl: number;
    isPublic: boolean;
    linkId: string;
};

export type ExpirationStatus = 'expired' | 'very_soon' | 'soon' | 'not_soon';

export type ClipboardEntryEnriched = ClipboardEntry & {
    formatedCreationDate: string;
    formatedExpirationDate: string;
    expirationStatus: ExpirationStatus;
};

export type ClipboardUploadData = {
    name: string;
    content: string;
    ttlSeconds: number;
    isPublic: boolean;
    file?: File;
};
