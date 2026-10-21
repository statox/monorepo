// Uploads a file straight to the bucket with a presigned PUT URL returned by a prepareUpload route.
// Plain fetch, not client2: this goes to the bucket, not our API, and must not carry cookies.
// `contentType` must be the one declared to prepareUpload: it is part of the URL signature.
export const putFileToPresignedUrl = async (params: {
    uploadUrl: string;
    file: File;
    contentType: string;
    failureHint: string;
}) => {
    const { uploadUrl, file, contentType, failureHint } = params;

    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file
    });
    if (!response.ok) {
        throw new Error(`Upload to storage failed (HTTP ${response.status}). ${failureHint}`);
    }
};
