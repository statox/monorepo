export type ClipboardEntry = {
    id: number;
    name: string;
    content: string;
    creationDateUnix: number;
    ttl: number;
    isPublic: boolean;
    linkId: string;
    s3Key?: string;
    s3PresignedUrl?: string;
};

export type ExpirationStatus = 'expired' | 'very_soon' | 'soon' | 'not_soon';

export type ClipboardEntryEnriched = ClipboardEntry & {
    formatedCreationDate: string;
    formatedExpirationDate: string;
    expirationStatus: ExpirationStatus;
};
