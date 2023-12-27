export type ClipboardEntry = {
    id: number;
    name: string;
    content: string;
    creationDateUnix: number;
    ttl: number;
    isPublic: boolean;
    linkId: string;
};

export type ExpirationStatus = 'expired' | 'very soon' | 'soon' | 'not soon';

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
};
