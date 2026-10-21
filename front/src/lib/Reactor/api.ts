import { client2, putFileToPresignedUrl } from '$lib/api';

// Must match the backend limits in back/src/libs/modules/reactor/constants.ts
// TODO: Move this in the SDK in `client.reactor.ALLOWED_MIMES` that will require changing the templating of the SDK
export const REACTOR_ALLOWED_MIMES = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp'
] as const;
type ReactorMime = (typeof REACTOR_ALLOWED_MIMES)[number];
export const REACTOR_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const isReactorMime = (mimetype: string): mimetype is ReactorMime =>
    (REACTOR_ALLOWED_MIMES as readonly string[]).includes(mimetype);

export const getReactionsForPublic = client2.reactor.getEntriesForPublic;

// 1. the API reserves the entry and signs an upload URL
// 2. the browser uploads the file straight to the bucket
// 3. the API checks the file is there and publishes the entry
export const uploadToReactor = async (input: { name: string; tags: string[] }, file: File) => {
    if (!isReactorMime(file.type)) {
        throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
    }

    const { linkId, uploadUrl } = await client2.reactor.prepareUpload({
        ...input,
        mimetype: file.type,
        sizeBytes: file.size
    });

    await putFileToPresignedUrl({
        uploadUrl,
        file,
        contentType: file.type,
        failureHint: `The name "${input.name}" stays reserved for up to 2 hours: retry later or use another name.`
    });

    await client2.reactor.confirmUpload({ linkId });
};
