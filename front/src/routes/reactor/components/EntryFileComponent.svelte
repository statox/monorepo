<script lang="ts">
    import mime from 'mime';
    import type { ClipboardEntryEnriched } from '$lib/Clipboard/types';

    export let entry: ClipboardEntryEnriched;

    type DisplayType = 'none' | 'image' | 'other';
    let type: DisplayType = 'none';

    if (entry.s3PresignedUrl) {
        type = 'other';
        const url = new URL(entry.s3PresignedUrl);
        const ext = (url.pathname.match(/[^.]+$/) ?? [])[0];
        const filetype = mime.getType(ext ?? '');
        if (filetype?.includes('image')) {
            type = 'image';
        }
    }
</script>

<div>
    {#if type === 'other'}
        <a href={entry.s3PresignedUrl}>{entry.s3Key}</a>
    {:else if type === 'image'}
        <a href={entry.s3PresignedUrl} download={entry.name}>
            <img src={entry.s3PresignedUrl} alt={entry.name} />
        </a>
    {/if}
</div>
