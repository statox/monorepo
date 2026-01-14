<script lang="ts">
    import {
        FormLayout,
        FormGrid,
        FormSubmitButton,
        handleFormError,
        showSuccessToast
    } from '$lib/components/FormLayout';
    import type { NoticeItem } from '$lib/components/Notice';
    import { uploadNewChord, type RawChord } from '$lib/Songbook';

    interface Props {
        onUpload: () => void;
    }

    let { onUpload }: Props = $props();

    let title: string = $state('');
    let artist: string = $state('');
    let url: string = $state('');
    let tagsStr: string = $state('');
    let uploading = $state(false);
    let noticeMessages: NoticeItem[] = $state([]);

    const upload = async () => {
        noticeMessages = [];

        if (!title) noticeMessages.push({ level: 'error', header: 'Title must be defined' });
        if (!artist) noticeMessages.push({ level: 'error', header: 'Artist must be defined' });
        if (!url) noticeMessages.push({ level: 'error', header: 'URL must be defined' });

        if (noticeMessages.length) return;

        const tags = tagsStr ? tagsStr.replaceAll(' ', '').split(',') : [];
        const newChord: RawChord = { title, artist, url, tags, creationDate: Date.now() };

        try {
            uploading = true;
            await uploadNewChord(newChord);
            showSuccessToast('Song added successfully');
            onUpload();
        } catch (error) {
            handleFormError(error);
        } finally {
            uploading = false;
        }
    };
</script>

<FormLayout
    title="Add a new song"
    backUrl="/songbook/edit"
    authMessage="Login to add a new song"
    {noticeMessages}
>
    <FormGrid>
        <label for="artist">Artist</label>
        <input type="text" bind:value={artist} />

        <label for="title">Title</label>
        <input type="text" bind:value={title} />

        <label for="url">URL</label>
        <input type="text" bind:value={url} />

        <label for="tags">Tags</label>
        <input type="text" bind:value={tagsStr} />

        <FormSubmitButton onclick={upload} loading={uploading} />
    </FormGrid>
</FormLayout>
