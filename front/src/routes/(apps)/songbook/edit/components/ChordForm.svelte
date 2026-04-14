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

    let fieldErrors: Record<string, string> = $state({});
    let title: string = $state('');
    let artist: string = $state('');
    let url: string = $state('');
    let tags: string = $state('');
    let uploading = $state(false);
    let noticeMessages: NoticeItem[] = $state([]);

    const validateTitle = () => {
        fieldErrors.title = title ? '' : 'Title is required';
    };

    const validateArtist = () => {
        fieldErrors.artist = artist ? '' : 'Artist is required';
    };

    const validateUrl = () => {
        try {
            new URL(url);
            fieldErrors.url = '';
        } catch {
            fieldErrors.url = url ? 'URL is invalid' : 'URL is required';
        }
    };

    const upload = async () => {
        noticeMessages = [];
        validateTitle();
        validateArtist();
        validateUrl();

        if (Object.values(fieldErrors).some((e) => e)) return;

        const tagList = tags ? tags.replaceAll(' ', '').split(',') : [];
        const newChord: RawChord = { title, artist, url, tags: tagList, creationDate: Date.now() };

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
    <FormGrid onsubmit={upload}>
        <label for="artist">Artist</label>
        <input id="artist" type="text" bind:value={artist} onblur={validateArtist} />
        {#if fieldErrors.artist}
            <span class="field-error">{fieldErrors.artist}</span>
        {/if}

        <label for="title">Title</label>
        <input id="title" type="text" bind:value={title} onblur={validateTitle} />
        {#if fieldErrors.title}
            <span class="field-error">{fieldErrors.title}</span>
        {/if}

        <label for="url">URL</label>
        <input id="url" type="text" bind:value={url} onblur={validateUrl} />
        {#if fieldErrors.url}
            <span class="field-error">{fieldErrors.url}</span>
        {/if}

        <label for="tags">Tags</label>
        <input id="tags" type="text" bind:value={tags} />

        <FormSubmitButton loading={uploading} />
    </FormGrid>
</FormLayout>
